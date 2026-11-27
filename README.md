# mojila.github.io

Static personal site at <https://mojila.github.io/> — an index of working notes and small
tools for a conservative, income-first portfolio.

| Path | What it is |
|---|---|
| `index.html` | Landing page: index of tools, notes and principles |
| `dividend-planner.html` | Interactive twelve-month dividend forecast and DCA planner |
| `notes/cash-plus-book.html` | Portfolio note: the cash-plus structure and the 3.38% hurdle rate |

Everything is plain, self-contained HTML/CSS/JS — no build step. Pushing to `master`
publishes the site through GitHub Pages (legacy branch build, root path).

Every page is behind a lightweight entry lock (`assets/gate.js`): the password is checked
in the browser against a salted SHA-256 hash, and an unlock lasts for the browser session.
This is a convenience gate, **not real access control** — static hosting cannot
authenticate, and the underlying HTML files remain publicly fetchable. Do not put anything
genuinely sensitive in the repository; use Cloudflare Access or a host with server-side
auth if real privacy is needed.

Informational only, not financial advice. No orders are placed from this site, and
sensitive account data is kept out of the repository by design.
