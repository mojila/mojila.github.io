# mojila.github.io

Static personal site at <https://mojila.github.io/> — an index of working notes and small
tools for a conservative, income-first portfolio.

| Path | What it is |
|---|---|
| `index.html` | Landing page: index of tools, notes and principles |
| `dividend-planner.html` | Interactive twelve-month dividend forecast and DCA planner |
| `notes/cash-plus-book.html` | Portfolio note: the cash-plus structure and the 3.38% hurdle rate |
| `notes/money-market.html` | Portfolio note: the IDR money market sleeve and total-asset map |

Everything is plain, self-contained HTML/CSS/JS — no runtime build step. Pushing to `master`
publishes the site through GitHub Pages (legacy branch build, root path).

Every page is behind a lightweight entry lock (`assets/gate.js`): the password is checked
in the browser against a salted SHA-256 hash, and an unlock lasts for the browser session.
This is a convenience gate, **not real access control** — static hosting cannot
authenticate, and the underlying HTML files remain publicly fetchable. Do not put anything
genuinely sensitive in the repository; use Cloudflare Access or a host with server-side
auth if real privacy is needed.

### Encrypted values (`assets/vault.js`)

Sensitive figures — balances, holdings, quantities, prices and the planner's baseline —
are not written into the HTML. They live in `site/assets/vault.js` as AES-256-GCM
ciphertext and are decrypted in the browser only after the gate unlocks. Until then every
marked element renders `***` and the page body is hidden.

- Plaintext source: `tools/vault-source.json` (repo root, not inside `site/`, never published).
- Build: `VAULT_PASSWORD='…' node tools/build-vault.mjs` writes `site/assets/vault.js`.
- Key derivation: PBKDF2-SHA256 (210k iterations) over the vault password. The gate verifies
  the password by decrypting the ciphertext, so no password hash is stored in the page.
- Session reloads reuse a key exported to `sessionStorage`; the password itself is never stored.

Pages mark values with `data-vault="key"` (text), `data-vault-html="key"` (markup) or
`data-vault-value="key"` (form input). `window.MojilaVault.get("planner")` resolves with
decrypted data for scripts that compute from it.

Caveat: with static hosting, the ciphertext and the client-side key-derivation code are
both public. This raises the effort needed to scrape figures and removes plaintext from the
HTML, but it is not cryptographic protection against a determined visitor.

Informational only, not financial advice. No orders are placed from this site, and
sensitive account data is kept out of the repository by design.
