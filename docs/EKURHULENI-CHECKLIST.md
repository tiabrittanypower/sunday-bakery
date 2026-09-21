# Ekurhuleni compliance checklist

Use this **before** public sales (Facebook ads, open WhatsApp catalogue, live PayFast).  
City of Ekurhuleni covers **Boksburg** and **Kempton Park**.

> Not legal advice. Confirm everything with Environmental Health. Tariffs and processes change.

---

## Why this matters

South Africa requires food businesses to meet **Regulation R638** hygiene standards. A **Certificate of Acceptability (COA)** is the usual municipal permit. Selling from home still counts as a food business when money changes hands.

Operating without a COA can lead to closure and fines. Ekurhuleni has publicly warned that food should only be bought from COA-approved premises, and that **fake COA / inspector scams** exist — pay only through official City channels.

---

## Call script (Environmental Health)

**Ask for:** Environmental Health / Certificate of Acceptability applications (confirm current number via [ekurhuleni.gov.za](https://www.ekurhuleni.gov.za) or City switchboard **011 999 0000**).

> Hi, I want to run a **home-based bakery** in [Boksburg / Kempton Park].  
> Model: **pre-order only**, one bake per week, **customer collection** on Sundays — not a café, not street food.  
>  
> Please tell me:  
> 1. How do I apply for a **Certificate of Acceptability**?  
> 2. Can a **residential kitchen** qualify, or do I need a dedicated / commercial kitchen?  
> 3. What is the current **inspection fee** and where do I pay (official channels only)?  
> 4. What documents do you need (ID, floor plan, training certificate, zoning, rates account, etc.)?  
> 5. Do I also need a **business licence** and/or **zoning consent use** for Sunday collection at home?  
> 6. If customers collect at a **partner café / church / market**, what is required for prep vs collection-only?  
> 7. Typical timeline from application to COA?  
>  
> Please send any forms or email address in writing. Thank you.

### After the call — write down

| Field | Your notes |
|-------|------------|
| Date / officer name | |
| Phone / email given | |
| Residential kitchen OK? Y/N/Unclear | |
| Inspection fee amount | |
| Documents list | |
| Zoning / business licence notes | |
| Partner collection notes | |
| Next step date | |

---

## Core requirements (typical — confirm locally)

- [ ] **Person in Charge (PIC)** food hygiene training (accredited)  
- [ ] Handler hygiene awareness if anyone helps  
- [ ] Premises ready for R638-style inspection (see kitchen list)  
- [ ] Simple food-safety pack: cleaning schedule, pest control, supplier list, temp logs  
- [ ] **COA application** submitted  
- [ ] **Inspection passed** · COA displayed  
- [ ] **Zoning / consent use** clarified for prep + collection  
- [ ] **Business licence** if municipality requires it for your model  
- [ ] Market stall permit if trading at markets  
- [ ] Written agreement if baking or collecting on someone else’s premises  

---

## Kitchen readiness (home)

Inspectors often care about:

| Area | Target |
|------|--------|
| Handwashing | Dedicated handwash with soap + paper towels (separate from food prep sink if required) |
| Surfaces | Cleanable, non-porous worktops |
| Storage | Food sealed, off floor; chemicals separate |
| Pest control | No open entry points; bait/monitoring as advised |
| Pets / traffic | No pets in bake area on production days; limited household traffic |
| Temperature | Fridge thermometer; cool baked goods before pack |
| Waste | Covered bins; regular removal |
| Water | Potable water; hot water for cleaning |
| Separation | As much as possible: bakery zone vs family living clutter |

Budget hygiene kit (illustrative): sealed containers, thermometer, soap station, disposable gloves, sanitiser, pest bait, spare bins — often **R500–R2 000** if structure is already sound. Structural plumbing/worktops can jump to **thousands**.

---

## Labelling minimum (every box)

- Business / trading name + contact  
- Product name (“Week 3 Braai Weekend Box”)  
- Bake / pack date  
- Ingredient list (practical, descending)  
- **Allergens in bold** (wheat/gluten, milk, egg, soy, nuts, sulphites as relevant)  
- Storage + “eat by”  
- Batch / bake number  
- “Prepared in a home kitchen” honesty line  

Templates: [LABELS-AND-CARDS.md](./LABELS-AND-CARDS.md).

---

## Business structure & tax (minimal)

| Item | Low-capital choice |
|------|--------------------|
| Entity | Sole prop first (no CIPC required) |
| Books | Spreadsheet: date, order, amount, ingredients, fees |
| VAT | Unlikely year 1 — confirm SARS compulsory threshold before registering |
| Income tax | Profit is taxable; keep proofs |
| Bank | Separate account or clear tagging of bakery income |

CIPC / Pty Ltd can wait until volume or liability needs it. **CIPC does not replace COA.**

---

## Payments & customer data

- [ ] Prepaid only (EFT proof or PayFast) before bake day  
- [ ] Clear no-show / refund policy on order confirmation  
- [ ] POPIA: store name/phone only for orders; newsletter is opt-in  
- [ ] Never claim “licensed / COA approved” until the certificate is in hand  

---

## Demo / pilot vs public

| Mode | Allowed posture |
|------|-----------------|
| **Private pilot** | Friends/family; honest “pilot” language; EFT; small capacity; learn ops while COA processes |
| **Public live** | COA path clear (ideally issued); stable collection; labels; prepaid; site PayFast optional |

App default stays `PAYMENT_MODE=demo` until you deliberately go live.

---

## Scam / safety flags

- City has warned about **COA fraud** — do not pay cash to someone who “inspects” at the door without official process  
- Verify bank details / payment portals on **ekurhuleni.gov.za** or written City correspondence  
- Keep copies of every application and receipt  

---

## Useful links (verify live)

- [Ekurhuleni — food safety messaging](https://www.ekurhuleni.gov.za/press-releases/health/know-the-safety-of-the-food-you-buy-and-eat/)  
- [Ekurhuleni — COA inspection fee notice](https://www.ekurhuleni.gov.za/press-releases/health/inspection-fee-for-the-issuing-of-certificate-of-acceptability-now-included-in-the-citys-tariffs/)  
- [R638 gazette PDF](https://www.gov.za/sites/default/files/gcis_document/201806/41730gon638.pdf)  
- [SARS VAT](https://www.sars.gov.za/types-of-tax/value-added-tax/)  

---

## Decision gate

**Do not run paid Facebook ads or mass public groups until:**

1. Call notes complete  
2. Kitchen path understood  
3. Labels ready  
4. Three clean pilot weeks **or** COA issued  
5. Collection point stable  

Then update `data/config.json` capacity, go `PAYMENT_MODE=payfast` if ready, and scale slowly.
