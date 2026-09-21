# Box fit (portions)

**Problem:** Original Month 1 yields were a full tea table (whole loaf + 4 large buns + 8 cookies + 4 scones) — too much for one takeaway box.

**Fix (v2):** Right-sized for **2–3 people** in a **standard bakery / cake box (~28–32 cm)**.

## Per-box contents (after right-size)

| Week | Contents |
|------|----------|
| 1 Classic | Mini lemon loaf (≈4 slices), **2** cinnamon buns, **4** shortbreads, **2** cheese scones |
| 2 Chocolate | **4** brownie squares, **4** cookies, **2** cupcakes, mini banana loaf |
| 3 Braai | Small malva (2–3 portions), **3** muffins, **3** rolls, **6** ginger biscuits |
| 4 Tea-Time | **4** scones, **4** milk tart squares, mini vanilla loaf, **4** shortbread fingers |

Recipe amounts in `data/recipes/month-1.json` match these yields (≈½ original batch).

## Packing tips

- Use one shallow bakery box with parchment; stack cookies/shortbread in a paper bag or sleeve.
- Mini loaves: small loaf tin or muffin-tin mini loaves.
- Malva: **small** foil tray only (not a family roasting tin).
- Do not force a full 8-slice loaf + 4 large buns into one box.

## Re-run

```bash
node scripts/rightsize-box-fit.js
```

Idempotent: will not double-halve amounts if `boxFit.version >= 2`.
