# Sunday Bakery — Low-Capital Launch Plan

**Market:** Boksburg / Kempton Park (City of Ekurhuleni, Gauteng)  
**Model:** Weekly pre-order bake boxes · local collection only · home kitchen  
**App:** this project (`npm start` → http://localhost:3001)  
**Last updated:** 2026-07-18

Related docs:

| Doc | Purpose |
|-----|---------|
| [RECIPES-MONTH-1.md](./RECIPES-MONTH-1.md) | Full recipes Weeks 1–4 |
| [SHOPPING-AND-PREP.md](./SHOPPING-AND-PREP.md) | Shopping lists + bake checklists |
| [LABELS-AND-CARDS.md](./LABELS-AND-CARDS.md) | Label & customer card templates |
| [EKURHULENI-CHECKLIST.md](./EKURHULENI-CHECKLIST.md) | Legal call script + compliance |
| `../data/menus/` | Weekly product JSON templates |

---

## One-sentence business

Pre-paid Sunday bake boxes for 2–4 people, baked to order, collected once a week in the Boksburg / Kempton Park area — no café, no delivery, no wasted stock.

---

## Legal reality (South Africa)

There is **no** US-style cottage-food exemption. Commercial food sale is covered by:

| Layer | What |
|-------|------|
| **R638 (2018)** | Food premises hygiene standard |
| **Certificate of Acceptability (COA)** | Ekurhuleni Environmental Health after inspection |
| **Zoning / business licence** | Often required; home collection can be sensitive |
| **Labelling (R146 / updates)** | Name, maker, date, allergens, storage |

**Private pilot** (friends/family, honest process) is for learning ops.  
**Public brand + ads + card payments** should wait until you have a clear COA / zoning path.

See [EKURHULENI-CHECKLIST.md](./EKURHULENI-CHECKLIST.md) before first public sale.

---

## Low-capital operating model

| Rule | Why |
|------|-----|
| Pre-order only | Near-zero waste |
| Paid before bake (EFT or PayFast) | No ghost orders |
| Capacity cap (start 8–15) | One baker, one oven |
| One themed box per week | Simple marketing + production |
| Collection only | No petrol / cold chain |
| Cutoff Friday 18:00 | Shop to order count |

### Collection options

1. **Partner café / church foyer** — best default (lower neighbour risk)  
2. **Home gate** — only short windows + zoning OK  
3. **Office desk champion** — Jet Park / Isando / Spartan  
4. **Market stall monthly** — discovery, not only channel  

### Startup cost (if you already own an oven)

| Band | ZAR |
|------|-----|
| Bootstrap essentials | ~R3 000–R7 000 |
| Proper home launch | ~R8 000–R18 000 |
| Kitchen needs real work | R15 000–R40 000+ |

**Essentials:** PIC food hygiene training, hygiene kit, packaging, first ingredients, labels, municipal fees (confirm).  
**Defer:** branded boxes, pro shoot, Pty Ltd, VAT, paid ads.

**Tax:** year-1 unlikely to hit compulsory VAT — keep a simple income/expense ledger; confirm SARS thresholds yourself.

### Unit economics (guide)

| | ZAR |
|--|-----|
| Sell | R245–R265 |
| Ingredients + pack | ~R95–R155 |
| Contribution before labour | ~R100–R150 / box |
| Target pilot volume | 10–15 boxes/week |

---

## Go-to-market (almost free)

1. WhatsApp Business — menu, status, opt-in list  
2. 15–25 warm pilot contacts first  
3. Local Facebook groups (value posts, follow rules)  
4. Church / school / sports (with permission)  
5. Office floor collectors  
6. Referrals after week 3  
7. Paid ads **only after** organic sell-outs  

**Positioning:**  
> Sunday bake boxes, pre-order only — collect Sunday morning in Boksburg / Kempton Park. Limited number. Pay before bake.

---

## First 30 days

| Phase | Action |
|-------|--------|
| **Week 0** | Cost recipes · labels · PIC training · call Ekurhuleni · choose collection · set `data/config.json` · invite pilot list |
| **Week 1** | Soft pilot 8–12 boxes · friends/family · feedback |
| **Week 2** | 12–18 boxes · warm network · time bakes · submit COA if ready |
| **Week 3** | Limited public 15–25 if quality stable · 1–2 FB groups |
| **Week 4** | Stabilise · 4-week P&L · decide go-live vs stay pilot |

### Demo vs go live

**Stay pilot when:** no COA path, no stable collection, inconsistent quality, unpaid chaos.  
**Go live when:** clear municipal path (ideally COA issued), 3 clean weeks, positive contribution/box, prepaid enforced, labels solid.

Payments: pilot = EFT; then optional PayFast (`PAYMENT_MODE=payfast` + Keys `SB_*`). Keep `demo` until ready.

---

## Month 1 menu (summary)

| Week | Theme | Sell | Hero items |
|------|--------|------|------------|
| 1 | After-Church Classic | R245 | Lemon loaf, cinnamon buns, jam shortbreads, cheese scones |
| 2 | Chocolate Sunday | R265 | Brownies, choc cookies, ganache cupcakes, cocoa banana loaf |
| 3 | Braai Weekend | R265 | Malva + sauce, corn muffins, milk rolls, ginger biscuits |
| 4 | Tea-Time Home | R250 | Scones, milk tart squares, vanilla loaf, shortbread |

Full methods: [RECIPES-MONTH-1.md](./RECIPES-MONTH-1.md).  
JSON templates: `data/menus/week-1.json` … `week-4.json`.

---

## Weekly ops (edit each bake)

1. Copy the right `data/menus/week-N.json` product fields into `data/config.json`  
2. Set `bakeNumber`, `collectionDate`, `collectionLabel`, `ordersCloseAt`, `capacity`  
3. Confirm collection address (placeholder until you lock a point)  
4. `npm start` · smoke test · publish WhatsApp menu  
5. After cutoff: shop → bake → label → collect → deep clean  

---

## Risks (short)

| Risk | Mitigation |
|------|------------|
| No COA | Private pilot; apply early |
| Neighbours | Partner collection; short windows |
| Food safety | Cool fully; fridge dairy; PIC training |
| Allergens | Bold list every week |
| Waste | Prepaid + bake-to-order |
| Burnout | Cap boxes; protect price floor |
| Load-shedding | Bake earlier |

---

## Success criteria (month 1)

- [ ] Ekurhuleni path documented (call notes)  
- [ ] Four pilot Sundays delivered on time  
- [ ] Positive contribution after ingredients + packaging  
- [ ] Repeat orders without begging  
- [ ] Labels + allergens on every box  
- [ ] Ledger / simple books for every sale  
