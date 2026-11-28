/* Client-side entry lock + encrypted value vault for mojila.github.io.
   Not real access control: static hosting cannot authenticate. It keeps casual
   visitors out of the rendered pages and keeps plain values out of the HTML:
   every number lives in assets/vault.js as AES-GCM ciphertext and is only
   decrypted and written into the DOM after the password unlocks the session. */
(function () {
  "use strict";

  var KEY = "insights-unlocked";
  var SALT = "mojila-insights-v1:";
  // SHA-256 of SALT + the entry password. The plaintext is not stored here.
  var EXPECTED = "bc6759720b4e987a5073bc5143157d856f5b1a10e655a33aa907a8fa4a21b02b";
  var VAULT = window.MOJILA_VAULT || null;

  var root = document.documentElement;
  var decrypted = null;
  var resolveReady, rejectReady;
  var ready = new Promise(function (res, rej) { resolveReady = res; rejectReady = rej; });

  function unlocked() {
    try { return sessionStorage.getItem(KEY) === EXPECTED; } catch (e) { return false; }
  }

  /* ---------- vault primitives ---------- */

  function b64ToBytes(s) {
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveKey(secret) {
    var kdf = VAULT.kdf;
    var base = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToBytes(kdf.salt), iterations: kdf.iterations, hash: kdf.hash },
      base,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );
  }

  function bytesToB64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function rememberKey(key) {
    try {
      crypto.subtle.exportKey("raw", key).then(function (raw) {
        try { sessionStorage.setItem("insights-vault-key", bytesToB64(new Uint8Array(raw))); } catch (e) {}
      }).catch(function () {});
    } catch (e) { /* non-extractable */ }
  }

  async function keyFromSession() {
    var raw;
    try { raw = sessionStorage.getItem("insights-vault-key"); } catch (e) { return null; }
    if (!raw) return null;
    try {
      return await crypto.subtle.importKey("raw", b64ToBytes(raw), "AES-GCM", true, ["decrypt"]);
    } catch (e) { return null; }
  }

  async function decryptAll(key) {
    var names = Object.keys(VAULT.payloads);
    var out = {};
    for (var i = 0; i < names.length; i++) {
      var p = VAULT.payloads[names[i]];
      var buf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64ToBytes(p.iv) }, key, b64ToBytes(p.data)
      );
      out[names[i]] = JSON.parse(new TextDecoder().decode(buf));
    }
    return out;
  }

  function fill() {
    if (!decrypted) return;
    var vals = decrypted.values || {};
    var nodes = document.querySelectorAll("[data-vault]");
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute("data-vault");
      if (Object.prototype.hasOwnProperty.call(vals, k)) nodes[i].textContent = vals[k];
    }
    var htmlNodes = document.querySelectorAll("[data-vault-html]");
    for (var j = 0; j < htmlNodes.length; j++) {
      var hk = htmlNodes[j].getAttribute("data-vault-html");
      if (Object.prototype.hasOwnProperty.call(vals, hk)) htmlNodes[j].innerHTML = vals[hk];
    }
    var valNodes = document.querySelectorAll("[data-vault-value]");
    for (var n = 0; n < valNodes.length; n++) {
      var vk = valNodes[n].getAttribute("data-vault-value");
      if (Object.prototype.hasOwnProperty.call(vals, vk)) valNodes[n].value = vals[vk];
    }
    root.classList.remove("vault-loading");
  }

  function settle() {
    fill();
    resolveReady(decrypted);
    try {
      document.dispatchEvent(new CustomEvent("vault:ready", { detail: decrypted }));
      window.dispatchEvent(new CustomEvent("vault:ready", { detail: decrypted }));
    } catch (e) { /* older engines */ }
  }

  function startWithKey(key) {
    if (!VAULT || !(window.crypto && crypto.subtle)) {
      return Promise.reject(new Error("Encrypted vault is unavailable."));
    }
    return decryptAll(key).then(function (m) {
      decrypted = m;
      rememberKey(key);
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", settle);
      } else {
        settle();
      }
      return m;
    });
  }

  function start(secret) {
    if (!VAULT || !(window.crypto && crypto.subtle)) {
      return Promise.reject(new Error("Encrypted vault is unavailable."));
    }
    return deriveKey(secret).then(startWithKey);
  }

  /* Public API used by the planner scripts: they wait for decrypted data
     instead of embedding positions and prices in the page source. */
  window.MojilaVault = {
    ready: ready,
    get: function (name) {
      return ready.then(function (m) {
        if (!Object.prototype.hasOwnProperty.call(m, name)) throw new Error("Unknown vault payload: " + name);
        return m[name];
      });
    },
    fill: fill
  };

  function unlockSession() {
    try { sessionStorage.setItem(KEY, EXPECTED); } catch (e) { /* private mode */ }
    root.classList.remove("gate-locked");
    var gate = document.getElementById("gate");
    if (gate) gate.remove();
    /* May run from <head> before <body> exists during a fast decrypt. */
    if (document.body) document.body.style.visibility = "";
  }

  async function sha256(text) {
    var data = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  /* ---------- boot ---------- */

  root.classList.add("vault-loading");

  /* Hide the page while placeholders are being filled, including on the
     session-key path where mountGate() is never called. */
  try {
    var bootCss = document.createElement("style");
    bootCss.textContent = "html.vault-loading body{visibility:hidden!important}";
    (document.head || root).appendChild(bootCss);
  } catch (e) { /* non-fatal */ }

  (async function boot() {
    var sessionKey = await keyFromSession();
    if (sessionKey) {
      var keyOk = false;
      try { await startWithKey(sessionKey); keyOk = true; }
      catch (e) { try { sessionStorage.removeItem("insights-vault-key"); } catch (err) {} }
      if (keyOk) { unlockSession(); return; }
    }

    if (VAULT && VAULT.kdf.mode === "session" && unlocked()) {
      var secretOk = false;
      try { await start(EXPECTED); secretOk = true; }
      catch (e) { try { sessionStorage.removeItem(KEY); } catch (err) {} }
      if (secretOk) { unlockSession(); return; }
    }

    root.classList.remove("vault-loading");
    root.classList.add("gate-locked");
    mountGate();
  })();

  function mountGate() {
    var css = document.createElement("style");
    css.textContent = [
      "html.vault-loading body{visibility:hidden!important}",
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

    function build() {
      if (document.getElementById("gate")) return;
      /* If values already decrypted, never leave the page locked with no dialog. */
      if (decrypted) {
        fill();
        root.classList.remove("gate-locked");
        root.classList.remove("vault-loading");
        return;
      }
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
          '<p class="gate-foot">Session-only client-side lock. Values decrypt in this tab only. Close the tab to relock.</p>' +
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
          if (VAULT && VAULT.kdf.mode === "password") {
            /* The ciphertext itself is the password check. */
            await start(value);
          } else {
            var hash = await sha256(SALT + value);
            if (hash !== EXPECTED) throw new Error("bad password");
            await start(EXPECTED);
          }
          unlockSession();
        } catch (e) {
          error.textContent = "That password is not right.";
          card.classList.remove("gate-shake");
          void card.offsetWidth;
          card.classList.add("gate-shake");
          input.select();
          root.classList.add("gate-locked");
        } finally {
          button.disabled = false;
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", build);
    } else {
      build();
    }
  }
})();
