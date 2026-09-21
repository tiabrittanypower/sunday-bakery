# Sunday Bakery â€” project rules

Weekly bake-box pre-orders (Boksburg / Kempton Park). Static front end + Node/Express API with demo or PayFast checkout.

**Canonical path (this workspace):** `C:\GROK\Life Whatever\Projects\Sunday Bakery`  
**Brand:** Sunday Bakery Â· **Portfolio:** Power Designs family / Business Ledger

---

## Stack

| Layer | Tech |
|-------|------|
| Front end | Vanilla HTML/CSS/JS PWA (`index.html`, `script.js`, `styles.css`, `service-worker.js`, `manifest.webmanifest`) |
| Server | Node 18+ Express (`server/index.js`, `server/store.js`, `server/payfast.js`, `server/email.js`) |
| Data | JSON files under `data/` |
| Payments | `PAYMENT_MODE=demo` (default) or `payfast` |
| Email | Optional SMTP via nodemailer; otherwise console log |

Do **not** introduce React/Next/Vue, TypeScript, or a database unless the user explicitly asks.

---

## Commands

```bash
npm install
copy .env.example .env   # Windows
npm start                # production-style
npm run dev              # node --watch
npm run smoke            # scripts/smoke-test.js
```

Default URL: `http://localhost:3001` (see `PORT` in `.env`).

---

## Layout (do not invent new homes without reason)

| Path | Role |
|------|------|
| `index.html`, `order-success.html`, `order-cancelled.html` | Customer pages |
| `script.js`, `styles.css` | Front-end behaviour and brand styling |
| `server/` | API, PayFast, email, store |
| `data/config.json` | **Weekly ops** — bake number, dates, capacity, product copy (edit each bake) |
| `data/menus/` | Month-1 week templates (copy product into config) |
| `docs/` | Launch plan, recipes, shopping, labels, Ekurhuleni checklist |
| `data/orders.json` | Runtime orders (gitignored) |
| `data/newsletter.json` | Runtime subscribers (gitignored) |
| `assets/` | Images, app icon |
| `.env` | Secrets — never commit; use `.env.example` as the template |

---

## Coding conventions

- Keep the stack plain: Express + vanilla JS. Prefer small, readable modules over new frameworks.
- Match existing style: CommonJS (`require`), 2-space indent, no build step for front end.
- Public API responses should stay stable for the front end (`/api/config`, `/api/orders`, `/api/newsletter`, `/api/payfast/notify`).
- Inventory: paid/confirmed orders count against `capacity`; pending PayFast holds reserve stock (~30 min). Do not break that contract without updating both store and UI.
- Never hardcode secrets, merchant keys, or SMTP passwords in source. Always use `process.env`.
- Weekly content lives in `data/config.json` â€” avoid hardcoding collection dates or prices in HTML/JS when config already supplies them.
- Copy/tone: warm, local East Rand bakery (Boksburg / Kempton Park); keep demo vs real payment language honest when mode is demo.
- Ops docs in `docs/` — do not invent a second launch plan location.

---

## Safety / data

- Do not commit `.env`, `data/orders.json`, or `data/newsletter.json`.
- Do not log full card or PayFast secret payloads.
- Prefer sandbox PayFast (`PAYFAST_SANDBOX=true`) unless the user is deliberately going live.
- Before changing payment flow, read `server/payfast.js` and the success/cancel pages together.

---

## Verification

After meaningful server or checkout changes:

1. `npm run smoke` if the smoke script covers the area you touched.
2. Manually: `npm start` â†’ load site â†’ place a **demo** order â†’ confirm console/order JSON behaviour.
3. Do not run live PayFast tests against real money without user confirmation.

---

## Portfolio sync (mandatory)

After meaningful work on this project, update central portfolio files per `C:\GROK\Life Whatever\main.md`:

- `C:\GROK\Life Whatever\Overview Memory\OVERVIEW-MEMORY.md` (always)
- `C:\GROK\Life Whatever\main.md` (Projects table) when path, status, or open tasks change

Primary path for this product: **`C:\GROK\Life Whatever\Projects\Sunday Bakery`** (not the older OneDrive static demo).

---

## Out of scope unless asked

- Multi-region delivery logistics
- Full multi-tenant baker admin UI
- Replacing JSON store with a hosted DB
- Redesigning brand identity from scratch
