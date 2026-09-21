# Sunday markets near Boksburg / Benoni

**Researched:** 2026-07-21 (Playwright + Google Chrome)  
**Area filter:** Boksburg / Benoni (+ nearby East Rand)  
**Requirement:** Markets open **every Sunday** (not monthly-only)  
**Method:** Playwright opened Facebook search + public Facebook pages; Bing/DuckDuckGo harvested `site:facebook.com` links when FB search hit a login wall. Screenshots in `docs/research-screens/`. Raw data: `sunday-markets-boksburg-benoni-research.json`, `sunday-markets-pass2.json`.

> **Limit:** Logged-out Facebook hides most posts/hours. Hours for East Rand Traders Square come from a **public Boksburg Community Group** thread that names that market. Confirm on their page while logged in before booking a stall.

---

## Best fit for “every Sunday” + Boksburg/Benoni

### 1. East Rand Traders Square (Boksburg) — **strongest local Sunday option**

| Field | Detail |
|-------|--------|
| **Where** | 4 Frank Road, Bardene Ext. 21, Boksburg (community: flea market opposite **East Rand Mall**) |
| **Sunday?** | **Yes** — community replies: **Tuesday–Sunday ~09:00–17:00** (festive season sometimes Mon + later close) |
| **Every Sunday?** | **Yes** under that schedule (weekly trading days, not a once-a-month event) |
| **Facebook** | https://www.facebook.com/ERTSquare/ |
| **Also seen** | https://www.facebook.com/East-Rand-Mall-Flea-Market-109848042488582/ · older “East Rand Flea Market” pages/groups |
| **Why it matters for Sunday Bakery** | Only clear **local + Sunday** trading window found in this pass. Good candidate for a stall / collection pop-up **if** they accept food vendors and COA rules allow it. |
| **Do next** | Message ERTSquare for **food stall fees**, power, tables, and any hygiene docs; confirm Sunday still matches 9–5. |

**Evidence (public group post):** *“they are open Tuesday to Sundays from 9am -5pm”* · *“Its open on Sundays i think they close at 5 or 6”* · replies point to **East Rand Traders Square**.

---

## Local markets found — **not every Sunday** (or unconfirmed)

| Market | Area | Facebook | Schedule (from public FB text) | Notes |
|--------|------|----------|--------------------------------|-------|
| **Benoni Market** | Benoni AH — 28 Benoni Rd | https://www.facebook.com/benonimarket/ | **Once a month** (~40–50 stalls; arts, food, plants) | Explicitly not weekly. Site: eastrandcraftersmarket.co.za |
| **Woodlands Farmers & Craft Market** | Boksburg — 189 Dr Vosloo Rd, Bartlette | https://www.facebook.com/100057119244216/ | **Once a month** family farmers market | Saturday-style events mentioned |
| **Bokkie & Bunny Park / Crafts in the Park** | Boksburg (Parkdene) + Benoni (Rynfield) | https://www.facebook.com/BOKBUN13/ · https://www.facebook.com/bokkieparkcraftmarket/ · https://www.facebook.com/craftsinthepark2/ | Posts advertise **Saturday** return (e.g. Sat 25 Jul) | Long-running craft/car-boot; **not confirmed as every Sunday** |
| **Junction 21 Indoor market** | Boksburg — Pepper Square, North Rand / Oosthuizen Rd | https://www.facebook.com/junction21/ | “Join our market over the weekend” (vague) | Indoor; **Sunday cadence not proven** on public page |
| **Heckers Garden Centre market** | Westwood, Boksburg (Kirschner Rd events) | FB events under Heckers / monthly fresh market | **Monthly** event style | Not every Sunday |
| **Happy Soul’s Market** | Benoni (page title) | https://www.facebook.com/HappySoulsMarket/ | Not readable logged-out | Check logged-in |
| **Ebotse Market in the park** | Benoni (page title) | https://www.facebook.com/people/Ebotse-Market-in-the-park/100068727156486/ | Not readable logged-out | Often golf-estate style; confirm day |
| **East Rand Outdoor Flea Market** | East Rand (name) | https://www.facebook.com/East-Rand-Outdoor-Flea-Market-272086179916864/ | Sparse public text | May be inactive/duplicate of ERTSquare scene |

---

## Every-Sunday but **outside** Boksburg/Benoni (not primary)

| Market | Area | Facebook | Note |
|--------|------|----------|------|
| **Rosebank Sunday Market** | Rosebank Mall (Joburg central/north) | https://www.facebook.com/RosebankSundayMarket/ | Clear **every Sunday / year-round** food + craft market — too far for East Rand collection pilot unless you expand later |

---

## Useful Facebook groups (stall hunting / word-of-mouth)

- **East Rand/Jozi Markets & Events** — https://www.facebook.com/groups/127870860643493/
- **Vendors/Markets Gauteng** — https://www.facebook.com/groups/300069497551139/
- **Flea and Craft Market Stalls South Africa** — https://www.facebook.com/groups/215312769226448/
- **Boksburg Community Group** — local Q&A (source of ERTSquare Sunday hours)

---

## Playwright session notes

1. Direct Facebook search URLs (`facebook.com/search/top/?q=…`) returned little usable content without login (empty titles / wall).
2. Public discovery came mainly from DuckDuckGo/Bing `site:facebook.com` + opening page URLs in Chrome via Playwright.
3. Screenshots: `C:\GROK\Life Whatever\Projects\Sunday Bakery\docs\research-screens\`
4. Scripts (re-runnable): `_research-sunday-markets-playwright.js`, `_research-markets-pass2.js`

---

## Recommended next steps (Sunday Bakery)

1. **Contact East Rand Traders Square first** — only weekly Sunday + Boksburg hit with public evidence.  
2. While logged into Facebook, re-check **Happy Soul’s**, **Ebotse**, **Junction 21**, and search **Events → “Sunday market” + Benoni/Boksburg**.  
3. Treat **Benoni Market**, **Woodlands**, **Heckers** as **monthly extras**, not the weekly core.  
4. **Bokkie/Bunny Park** — ask if they ever trade Sundays; public posts lean Saturday.  
5. Align any market stall with COA / PIC rules already on your checklist.

---

*Generated for Sunday Bakery East Rand pilot — collection/stall research, not a legal trading licence.*
