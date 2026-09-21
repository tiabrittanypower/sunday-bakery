# Sunday Bakery — project rules

| Field | Value |
|-------|--------|
| **Path** | `C:\GROK\Life Whatever\Projects\Sunday Bakery` |
| **Brand** | Sunday Bakery |
| **Status** | Active product app (local) · East Rand pilot |
| **Market** | Boksburg / Kempton Park collection |
| **Stack** | Vanilla PWA + Node/Express + JSON store; PayFast optional |
| **Run** | `npm install` · `npm start` → http://localhost:3001 |
| **Dashboard** | http://localhost:3001/dashboard.html · recreate shortcut under `C:\GROK\workspace\shortcuts\` if needed |
| **Secrets** | Runtime `.env`; master vault `C:\GROK\Life Whatever\Keys\.env` (`SB_*`) |

## Rules

- Do **not** introduce React/Next/Vue, TypeScript, or a database unless the user asks.
- Weekly ops: edit `data/config.json` (templates in `data/menus/`).
- Launch / recipes / compliance: `docs/`. Box fit: `docs/BOX-FIT.md`. Costings: `data/costings/`.
- Full conventions also in `AGENTS.md`.
- Never commit `.env` or order/newsletter runtime JSON secrets.

## Key files

`AGENTS.md`, `README.md`, `docs/`, `index.html`, `dashboard.html`, `dashboard.js`, `script.js`, `server/`, `data/config.json`, `data/menus/`, `data/recipes/month-1.json`, `data/costings/`, `assets/recipes/`

## 2026-07-21 session notes

- Bake Dashboard: scale by boxes ordered, photos, shopping list, costing panel
- Box-fit v2 portions for 2–3 people
- Costings with packaging + electricity (~R3.50/kWh); Week 1 batch cost ~R105, menu R245 OK
- East Rand markets research; ERTSquare best weekly Sunday option
- Scratch / shortcuts under `C:\GROK\workspace` (recreate `.lnk` files under `C:\GROK\workspace\shortcuts\` if needed)
