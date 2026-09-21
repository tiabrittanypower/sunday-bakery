/**
 * Right-size Month 1 recipes so one box fits a standard bakery box (2–3 people).
 * Halves original "tea table" yields. Updates recipes JSON + menus + live config.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RECIPES = path.join(ROOT, "data", "recipes", "month-1.json");

const YIELDS = {
  "lemon-drizzle-loaf": { yield: "1 mini loaf ≈ 4 slices", factor: 0.5 },
  "cinnamon-swirl-buns": { yield: "2 medium buns", factor: 0.5 },
  "apricot-thumbprints": { yield: "4 biscuits", factor: 0.5 },
  "jam-thumbprint-shortbreads": { yield: "4 biscuits", factor: 0.5 },
  "cheese-chive-scones": { yield: "2 medium scones", factor: 0.5 },
  "fudgy-brownies": { yield: "4 squares", factor: 0.5 },
  "double-choc-cookies": { yield: "4 medium cookies", factor: 0.5 },
  "vanilla-cupcakes-ganache": { yield: "2 cupcakes", factor: 0.5 },
  "ganache-cupcakes": { yield: "2 cupcakes", factor: 0.5 },
  "cocoa-banana-loaf": { yield: "1 mini loaf ≈ 4 slices", factor: 0.5 },
  "malva-pudding": { yield: "2–3 portions in small foil tray", factor: 0.5 },
  "cheddar-corn-muffins": { yield: "3 muffins", factor: 0.5 },
  "milk-dinner-rolls": { yield: "3 soft rolls", factor: 0.5 },
  "ginger-biscuits": { yield: "6 biscuits", factor: 0.6 },
  "plain-fruit-scones": { yield: "4 scones (2 plain + 2 fruit)", factor: 0.67 },
  "milk-tart-squares": { yield: "4 squares", factor: 0.45 },
  "vanilla-butter-loaf": { yield: "1 mini loaf ≈ 4 slices", factor: 0.5 },
  "shortbread-fingers": { yield: "4 fingers", factor: 0.5 },
};

const CONTENTS = {
  1: [
    "Mini lemon drizzle loaf (≈4 slices)",
    "2 soft cinnamon swirl buns",
    "4 apricot jam thumbprint shortbreads",
    "2 cheese & chive scones",
  ],
  2: [
    "4 fudgy brownie squares",
    "4 double-chocolate cookies",
    "2 vanilla cupcakes with ganache",
    "Mini cocoa banana loaf (≈4 slices)",
  ],
  3: [
    "Malva pudding + sauce (small tray, 2–3 portions)",
    "3 cheddar corn muffins",
    "3 soft milk dinner rolls",
    "6 ginger biscuits",
  ],
  4: [
    "4 scones (2 plain + 2 fruit)",
    "4 milk tart squares",
    "Mini vanilla butter loaf (≈4 slices)",
    "4 shortbread fingers",
  ],
};

const DESCRIPTIONS = {
  1: "A shareable Sunday box for 2–3: mini lemon drizzle, two cinnamon buns, four jam shortbreads and two cheese scones — packed to fit, not a full tea table.",
  2: "Chocolate treat box for 2–3: four brownie squares, four cookies, two ganache cupcakes and a mini cocoa banana loaf.",
  3: "Braai weekend box for 2–3: small malva tray with sauce, three corn muffins, three milk rolls and six ginger biscuits.",
  4: "Tea-time box for 2–3: four scones, four milk tart squares, mini vanilla loaf and four shortbread fingers.",
};

const NAMES = {
  1: "After-Church Classic box",
  2: "Chocolate Sunday box",
  3: "Braai Weekend box",
  4: "Tea-Time Home box",
};

const PRICES = { 1: 245, 2: 265, 3: 265, 4: 250 };

function scaleAmt(amount, unit, factor) {
  const u = String(unit || "").toLowerCase();
  let a = Number(amount) * factor;
  if (u === "each" || u === "egg" || u === "eggs") {
    return Math.max(1, Math.round(a));
  }
  if (u === "pinch") return Math.max(1, Math.round(a));
  if (u === "tsp" || u === "tbsp" || u === "tin") {
    a = Math.round(a * 10) / 10;
    return a < 0.5 ? 0.5 : a;
  }
  return Math.max(1, Math.round(a));
}

function alreadyRightSized(data) {
  return data.boxFit && data.boxFit.version >= 2;
}

function main() {
  const d = JSON.parse(fs.readFileSync(RECIPES, "utf8"));

  if (alreadyRightSized(d)) {
    console.log("Already box-fit v2 — skipping amount scale (update copy only if needed)");
  } else {
    d.scaleNote =
      "Quantities = 1 customer box (right-sized for 2–3 people to fit a standard bakery box). Multiply by boxes ordered.";
    d.boxFit = {
      version: 2,
      people: "2–3",
      packaging:
        "Standard bakery / takeaway cake box (~28–32 cm long). Four compact items per box.",
      note: "Reduced from original Month 1 “tea-table” yields so the box packs without crushing.",
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    for (const w of d.weeks) {
      w.boxContents = CONTENTS[w.week];
      for (const r of w.recipes) {
        const cfg = YIELDS[r.id] || {
          factor: 0.5,
          yield: (r.yield || "") + " (box-fit)",
        };
        r.yield = cfg.yield;
        r.boxFitFactor = cfg.factor;
        for (const ing of r.ingredients || []) {
          ing.amount = scaleAmt(ing.amount, ing.unit, cfg.factor);
        }
        if (r.methodNote && !/Box-fit batch/i.test(r.methodNote)) {
          r.methodNote +=
            " Box-fit batch: smaller tin / fewer pieces — watch bake time (often 5–10 min less).";
        }
      }
    }
    fs.writeFileSync(RECIPES, JSON.stringify(d, null, 2) + "\n");
    console.log("Updated", RECIPES);
  }

  // Menus
  for (let week = 1; week <= 4; week++) {
    const menuPath = path.join(ROOT, "data", "menus", `week-${week}.json`);
    if (!fs.existsSync(menuPath)) continue;
    const menu = JSON.parse(fs.readFileSync(menuPath, "utf8"));
    menu.product = menu.product || {};
    menu.product.name = NAMES[week];
    menu.product.price = PRICES[week];
    menu.product.description = DESCRIPTIONS[week];
    menu.product.tag = "One box · four bakes · fits a standard bakery box · for 2–3";
    menu.product.contents = CONTENTS[week];
    menu.notes =
      (menu.notes ? menu.notes + " " : "") +
      "Box-fit v2: portions reduced so items pack cleanly.";
    menu.recommendedPrice = PRICES[week];
    fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2) + "\n");
    console.log("Updated menu week", week);
  }

  // Live config (week 1 operating)
  const configPath = path.join(ROOT, "data", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.product = {
    ...config.product,
    name: NAMES[1],
    price: PRICES[1],
    description: DESCRIPTIONS[1],
    tag: "One box · four bakes · fits a bakery box · for 2–3",
    contents: CONTENTS[1],
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log("Updated config.json product");

  // Doc
  const doc = `# Box fit (portions)

**Problem:** Original Month 1 yields were a full tea table (whole loaf + 4 large buns + 8 cookies + 4 scones) — too much for one takeaway box.

**Fix (v2):** Right-sized for **2–3 people** in a **standard bakery / cake box (~28–32 cm)**.

## Per-box contents (after right-size)

| Week | Contents |
|------|----------|
| 1 Classic | Mini lemon loaf (≈4 slices), **2** cinnamon buns, **4** shortbreads, **2** cheese scones |
| 2 Chocolate | **4** brownie squares, **4** cookies, **2** cupcakes, mini banana loaf |
| 3 Braai | Small malva (2–3 portions), **3** muffins, **3** rolls, **6** ginger biscuits |
| 4 Tea-Time | **4** scones, **4** milk tart squares, mini vanilla loaf, **4** shortbread fingers |

Recipe amounts in \`data/recipes/month-1.json\` match these yields (≈½ original batch).

## Packing tips

- Use one shallow bakery box with parchment; stack cookies/shortbread in a paper bag or sleeve.
- Mini loaves: small loaf tin or muffin-tin mini loaves.
- Malva: **small** foil tray only (not a family roasting tin).
- Do not force a full 8-slice loaf + 4 large buns into one box.

## Re-run

\`\`\`bash
node scripts/rightsize-box-fit.js
\`\`\`

Idempotent: will not double-halve amounts if \`boxFit.version >= 2\`.
`;
  fs.writeFileSync(path.join(ROOT, "docs", "BOX-FIT.md"), doc);
  console.log("Wrote docs/BOX-FIT.md");

  // Summary
  const check = JSON.parse(fs.readFileSync(RECIPES, "utf8"));
  for (const w of check.weeks) {
    console.log("\nWeek", w.week, w.themeName);
    (w.boxContents || []).forEach((c) => console.log("  •", c));
  }
}

main();
