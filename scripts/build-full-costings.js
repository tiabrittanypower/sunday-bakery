/**
 * Full box economics: ingredients (Checkers/Gauteng pack rates) + packaging
 * + electricity + small overhead → cost per box + recommended sell price.
 *
 * Output:
 *   data/costings/checkers-prices.json
 *   data/costings/box-costings.json
 *   data/costings/COSTINGS-SUMMARY.md
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RECIPES_PATH = path.join(ROOT, "data", "recipes", "month-1.json");
const PRICES_PATH = path.join(ROOT, "data", "costings", "checkers-prices.json");
const OUT_PATH = path.join(ROOT, "data", "costings", "box-costings.json");
const MD_PATH = path.join(ROOT, "data", "costings", "COSTINGS-SUMMARY.md");

/**
 * Pack prices — Checkers / East Rand supermarket ballpark (ZAR, 2025–26).
 * Source note: online scrape often blocked; these are owner-verifiable Checkers prices.
 * Re-price at your local Checkers before locking public sell prices.
 */
const PACKS = [
  { key: "cake-flour", packLabel: "Cake flour 2.5 kg", packQty: 2500, packUnit: "g", packPrice: 44.99 },
  { key: "bread-flour", packLabel: "Bread flour 2.5 kg", packQty: 2500, packUnit: "g", packPrice: 42.99 },
  { key: "white-sugar", packLabel: "White sugar 2.5 kg", packQty: 2500, packUnit: "g", packPrice: 56.99 },
  { key: "brown-sugar", packLabel: "Brown sugar 1 kg", packQty: 1000, packUnit: "g", packPrice: 34.99 },
  { key: "castor-sugar", packLabel: "Castor sugar 500 g", packQty: 500, packUnit: "g", packPrice: 29.99 },
  { key: "icing-sugar", packLabel: "Icing sugar 500 g", packQty: 500, packUnit: "g", packPrice: 26.99 },
  { key: "butter", packLabel: "Butter 500 g", packQty: 500, packUnit: "g", packPrice: 68.99 },
  { key: "milk", packLabel: "Full cream milk 2 L", packQty: 2000, packUnit: "ml", packPrice: 36.99 },
  { key: "cream", packLabel: "Fresh cream 250 ml", packQty: 250, packUnit: "ml", packPrice: 29.99 },
  { key: "eggs", packLabel: "Large eggs 18s", packQty: 18, packUnit: "each", packPrice: 72.99 },
  { key: "egg-yolk", packLabel: "Large eggs 18s (per yolk = 1 egg)", packQty: 18, packUnit: "each", packPrice: 72.99 },
  { key: "cheddar", packLabel: "Cheddar 500 g", packQty: 500, packUnit: "g", packPrice: 92.99 },
  { key: "oil", packLabel: "Sunflower oil 750 ml", packQty: 750, packUnit: "ml", packPrice: 34.99 },
  { key: "cocoa", packLabel: "Cocoa powder 250 g", packQty: 250, packUnit: "g", packPrice: 56.99 },
  { key: "chocolate-chips", packLabel: "Chocolate chips 250 g", packQty: 250, packUnit: "g", packPrice: 48.99 },
  { key: "chocolate", packLabel: "Baking chocolate ~100 g", packQty: 100, packUnit: "g", packPrice: 26.99 },
  { key: "instant-yeast", packLabel: "Instant yeast 10 g sachet", packQty: 10, packUnit: "g", packPrice: 9.99 },
  { key: "baking-powder", packLabel: "Baking powder 100 g", packQty: 100, packUnit: "g", packPrice: 24.99 },
  { key: "bicarb", packLabel: "Bicarb 100 g", packQty: 100, packUnit: "g", packPrice: 19.99 },
  { key: "vanilla", packLabel: "Vanilla essence 50 ml", packQty: 50, packUnit: "ml", packPrice: 32.99 },
  { key: "cinnamon", packLabel: "Ground cinnamon 50 g", packQty: 50, packUnit: "g", packPrice: 26.99 },
  { key: "ground-ginger", packLabel: "Ground ginger 50 g", packQty: 50, packUnit: "g", packPrice: 26.99 },
  { key: "apricot-jam", packLabel: "Apricot jam 450 g", packQty: 450, packUnit: "g", packPrice: 36.99 },
  { key: "raisins", packLabel: "Raisins 500 g", packQty: 500, packUnit: "g", packPrice: 42.99 },
  { key: "condensed-milk", packLabel: "Condensed milk 385 g", packQty: 385, packUnit: "g", packPrice: 34.99 },
  { key: "bananas", packLabel: "Bananas per kg", packQty: 1000, packUnit: "g", packPrice: 24.99 },
  { key: "lemons", packLabel: "Lemons each", packQty: 1, packUnit: "each", packPrice: 4.5 },
  { key: "lemon-juice", packLabel: "Lemon juice (~from 1 lemon / 30 ml)", packQty: 30, packUnit: "ml", packPrice: 4.5 },
  { key: "sweetcorn", packLabel: "Sweetcorn tin 410 g", packQty: 410, packUnit: "g", packPrice: 19.99 },
  { key: "chives", packLabel: "Fresh chives bunch", packQty: 1, packUnit: "bunch", packPrice: 18.99 },
  { key: "golden-syrup", packLabel: "Golden syrup 500 g", packQty: 500, packUnit: "g", packPrice: 42.99 },
  { key: "vinegar", packLabel: "White vinegar 750 ml", packQty: 750, packUnit: "ml", packPrice: 18.99 },
  { key: "salt", packLabel: "Table salt 1 kg", packQty: 1000, packUnit: "g", packPrice: 17.99 },
  { key: "black-pepper", packLabel: "Black pepper 100 g", packQty: 100, packUnit: "g", packPrice: 32.99 },
  { key: "maizena", packLabel: "Maizena 500 g", packQty: 500, packUnit: "g", packPrice: 36.99 },
  { key: "foil-tray", packLabel: "Foil trays (pack of 6)", packQty: 6, packUnit: "each", packPrice: 36.99 },
  { key: "sauce-jar", packLabel: "Small sauce jar", packQty: 1, packUnit: "each", packPrice: 8.99 },
  { key: "water", packLabel: "Tap water", packQty: 1000, packUnit: "ml", packPrice: 0 },
];

/** Overhead model (ZAR). Electricity: home oven allocation per box. */
const OVERHEAD = {
  electricity: {
    // City Power / Eskom prepaid mid block rough 2026 — adjust in dashboard later
    ratePerKwh: 3.5,
    ovenKw: 2.2, // typical electric oven draw while baking
    // Estimated oven-on hours to produce ONE box (preheat + bake all 4 items, shared batching later)
    // Box-fit batches are smaller → slightly less time than full tea-table
    hoursPerBoxByWeek: {
      1: 1.35, // loaf + buns + shortbread + scones (buns longest proof, oven ~80 min active)
      2: 1.25, // brownies, cookies, cupcakes, banana loaf
      3: 1.4, // malva, muffins, rolls, biscuits
      4: 1.3, // scones, milk tart, loaf, shortbread
    },
    // When baking N boxes in one session, electricity scales sub-linearly.
    // unit factor: electricityPerBox = fullSolo * batchEfficiency(N)
    // For costing we report SOLO box first, then note batch of 10.
    batchOf10Factor: 0.45, // ~45% of solo kWh per box when baking 10 together
  },
  packaging: {
    bakeryBox: 8.5, // plain cake/bakery box
    parchmentBags: 2.0, // liner + cookie sleeve
    stickerLabel: 1.5,
    thankYouCard: 1.0,
    // Week 3 already has foil tray + jar in ingredients; extra tape etc.
    tapeTwine: 0.5,
  },
  otherPerBox: {
    cleaningConsumables: 1.5, // soap, cloths share
    equipmentWear: 2.0, // tins, mixer, scale amortisation
    wastageContingencyPct: 0.05, // 5% on ingredients
  },
  labour: {
    // Optional: not in "cash cost" but shown for recommended price floor
    minutesPerBoxSolo: 45,
    ratePerHour: 0, // set >0 if you want labour in cash cost; default 0 (owner time)
  },
  pricing: {
    // Recommended sell = max(current menu price, cost * markup, cost / (1-margin))
    targetMarginOnSell: 0.52, // 52% gross on sell after full cash cost
    minMarkupOnCost: 2.15, // at least 2.15x total cash cost
    roundTo: 5, // round sell up to nearest R5
  },
};

function toBaseAmount(amount, unit, priceItem) {
  const a = Number(amount) || 0;
  const u = String(unit || "").toLowerCase();
  const packUnit = String(priceItem.packUnit || "").toLowerCase();
  const key = priceItem.key;

  if (u === packUnit) return a;
  if ((u === "each" || u === "egg" || u === "eggs") && packUnit === "each") return a;

  if (u === "tsp") {
    if (packUnit === "ml") return a * 5;
    if (packUnit === "g") {
      if (key === "cinnamon" || key === "ground-ginger") return a * 2.5;
      if (key === "bicarb" || key === "baking-powder") return a * 4;
      if (key === "salt") return a * 6;
      if (key === "vanilla") return a * 5;
      return a * 4;
    }
  }
  if (u === "tbsp") {
    if (packUnit === "ml") return a * 15;
    if (packUnit === "g") {
      if (key === "cocoa") return a * 7;
      if (key === "apricot-jam" || key === "golden-syrup") return a * 20;
      if (key === "white-sugar") return a * 12;
      if (key === "butter") return a * 14;
      if (key === "maizena" || key === "cake-flour") return a * 8;
      return a * 12;
    }
  }
  if (u === "pinch" && packUnit === "g") return a * 0.3;
  if (u === "pinch") return 0;
  if (u === "tin" && key === "condensed-milk") return a * (priceItem.packQty || 385);
  if (key === "chives" && u === "tbsp") return a * 0.25;
  return a;
}

function unitCost(item) {
  if (!item || item.packPrice == null) return null;
  const qty = Number(item.packQty) || 0;
  if (qty <= 0) return null;
  return item.packPrice / qty;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function roundSell(n, step) {
  return Math.ceil(n / step) * step;
}

function costIngredientLine(ing, priceByKey) {
  const item = priceByKey[ing.key];
  if (!item) {
    return {
      key: ing.key,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      cost: 0,
      missing: true,
    };
  }
  const base = toBaseAmount(ing.amount, ing.unit, item);
  const uc = unitCost(item);
  const cost = uc == null ? 0 : base * uc;
  return {
    key: ing.key,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    cost: round2(cost),
    packLabel: item.packLabel,
    packPrice: item.packPrice,
    missing: false,
  };
}

function packagingTotal(weekNum) {
  const p = OVERHEAD.packaging;
  let t = p.bakeryBox + p.parchmentBags + p.stickerLabel + p.thankYouCard + p.tapeTwine;
  // Week 3 foil/jar already in recipe ingredients — no double count here
  return round2(t);
}

function electricitySolo(weekNum) {
  const e = OVERHEAD.electricity;
  const hours = e.hoursPerBoxByWeek[weekNum] || 1.3;
  const kwh = hours * e.ovenKw;
  const cost = kwh * e.ratePerKwh;
  return {
    hours,
    ovenKw: e.ovenKw,
    kwh: round2(kwh),
    ratePerKwh: e.ratePerKwh,
    cost: round2(cost),
    costBatch10: round2(cost * e.batchOf10Factor),
  };
}

function recommendedSell(totalCashCost, menuPrice) {
  const p = OVERHEAD.pricing;
  const byMargin = totalCashCost / (1 - p.targetMarginOnSell);
  const byMarkup = totalCashCost * p.minMarkupOnCost;
  const raw = Math.max(byMargin, byMarkup, totalCashCost * 1.5);
  const recommended = roundSell(raw, p.roundTo);
  // Keep at least menu if already higher (brand positioning)
  const floor = recommended;
  const suggested = Math.max(floor, 0);
  return {
    recommended: suggested,
    targetMarginOnSell: p.targetMarginOnSell,
    minMarkupOnCost: p.minMarkupOnCost,
    vsMenu: menuPrice,
    note:
      suggested > menuPrice
        ? "Recommended above current menu — raise price or cut cost"
        : "Current menu is at/above cost-based recommendation — OK if quality holds",
  };
}

function main() {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const pricesPayload = {
    source: "Checkers / Gauteng supermarket pack estimates (verify at checkers.co.za or in-store)",
    currency: "ZAR",
    scrapedAt: new Date().toISOString(),
    regionNote:
      "East Rand / Joburg ballpark. Online scrape is often blocked; re-check sticky prices before pilot sell.",
    items: PACKS.map((p) => ({
      ...p,
      status: p.packPrice === 0 ? "fixed" : "estimate_checkers_gauteng",
    })),
  };
  fs.writeFileSync(PRICES_PATH, JSON.stringify(pricesPayload, null, 2) + "\n");

  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, "utf8"));
  const priceByKey = Object.fromEntries(PACKS.map((p) => [p.key, p]));

  const weeks = (recipes.weeks || []).map((week) => {
    const recipeCosts = (week.recipes || []).map((recipe) => {
      const lines = (recipe.ingredients || []).map((ing) =>
        costIngredientLine(ing, priceByKey)
      );
      const ingredientCost = round2(
        lines.reduce((s, l) => s + (l.cost || 0), 0)
      );
      return {
        id: recipe.id,
        name: recipe.name,
        yield: recipe.yield,
        image: recipe.image || null,
        ingredientCost,
        lines,
      };
    });

    const ingredientsSubtotal = round2(
      recipeCosts.reduce((s, r) => s + r.ingredientCost, 0)
    );
    const wastage = round2(
      ingredientsSubtotal * OVERHEAD.otherPerBox.wastageContingencyPct
    );
    const ingredientsWithWaste = round2(ingredientsSubtotal + wastage);
    const packaging = packagingTotal(week.week);
    const elec = electricitySolo(week.week);
    const other =
      OVERHEAD.otherPerBox.cleaningConsumables +
      OVERHEAD.otherPerBox.equipmentWear;
    const labourHours = OVERHEAD.labour.minutesPerBoxSolo / 60;
    const labourCost = round2(labourHours * (OVERHEAD.labour.ratePerHour || 0));

    const cashCostSolo = round2(
      ingredientsWithWaste + packaging + elec.cost + other + labourCost
    );
    const cashCostBatch10 = round2(
      ingredientsWithWaste +
        packaging +
        elec.costBatch10 +
        other +
        labourCost
    );

    const menuPrice = Number(week.price) || 0;
    const sell = recommendedSell(cashCostSolo, menuPrice);
    // Also compute rec from batch-10 (more realistic pilot)
    const sellBatch = recommendedSell(cashCostBatch10, menuPrice);

    const marginAtMenuSolo = round2(menuPrice - cashCostSolo);
    const marginAtMenuBatch = round2(menuPrice - cashCostBatch10);
    const marginPctMenuSolo =
      menuPrice > 0 ? round2((marginAtMenuSolo / menuPrice) * 100) : null;
    const marginPctMenuBatch =
      menuPrice > 0 ? round2((marginAtMenuBatch / menuPrice) * 100) : null;

    return {
      week: week.week,
      themeName: week.themeName,
      boxContents: week.boxContents || [],
      menuPrice,
      costs: {
        ingredients: ingredientsSubtotal,
        wastageContingency: wastage,
        ingredientsWithWaste,
        packaging,
        electricitySolo: elec.cost,
        electricityBatch10: elec.costBatch10,
        electricityDetail: elec,
        cleaningAndWear: round2(other),
        labour: labourCost,
        totalCashCostSolo: cashCostSolo,
        totalCashCostBatch10: cashCostBatch10,
      },
      marginAtCurrentMenu: {
        solo: { rand: marginAtMenuSolo, percent: marginPctMenuSolo },
        batch10: { rand: marginAtMenuBatch, percent: marginPctMenuBatch },
      },
      recommendedSellPrice: {
        basedOnSoloBake: sell.recommended,
        basedOnBatchOf10: sellBatch.recommended,
        /** Primary recommendation for pilot: batch of 10 (how you will bake) */
        primary: sellBatch.recommended,
        rationale: sellBatch.note,
        targetMarginOnSell: OVERHEAD.pricing.targetMarginOnSell,
        minMarkupOnCost: OVERHEAD.pricing.minMarkupOnCost,
      },
      recipes: recipeCosts,
    };
  });

  const payload = {
    currency: "ZAR",
    builtAt: new Date().toISOString(),
    boxFit: recipes.boxFit || null,
    priceSource: pricesPayload.source,
    overheadAssumptions: OVERHEAD,
    disclaimer:
      "Estimates only. Ingredient packs from Checkers/Gauteng ballpark; electricity uses ~R3.50/kWh and 2.2 kW oven. Re-price packs in-store and check your prepaid tariff. No labour wage unless rate set. Not tax advice.",
    weeks,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n");

  // Markdown summary for owner
  let md = `# Sunday Bakery — box costings & recommended sell price\n\n`;
  md += `**Built:** ${payload.builtAt.slice(0, 16).replace("T", " ")}  \n`;
  md += `**Portions:** box-fit v2 (2–3 people)  \n`;
  md += `**Prices:** ${pricesPayload.source}  \n`;
  md += `**Electricity:** R${OVERHEAD.electricity.ratePerKwh}/kWh × ${OVERHEAD.electricity.ovenKw} kW oven  \n\n`;
  md += `> ${payload.disclaimer}\n\n`;
  md += `## Quick view (primary = baking ~10 boxes in one go)\n\n`;
  md += `| Week | Theme | Ingredient+waste | Pack | Elec (batch10) | Other | **Total cost** | **Menu now** | **Margin @ menu** | **Recommended sell** |\n`;
  md += `|------|-------|------------------|------|----------------|-------|----------------|--------------|-------------------|----------------------|\n`;

  for (const w of weeks) {
    const c = w.costs;
    md += `| ${w.week} | ${w.themeName} | R${c.ingredientsWithWaste.toFixed(2)} | R${c.packaging.toFixed(2)} | R${c.electricityBatch10.toFixed(2)} | R${c.cleaningAndWear.toFixed(2)} | **R${c.totalCashCostBatch10.toFixed(2)}** | R${w.menuPrice} | R${w.marginAtCurrentMenu.batch10.rand} (${w.marginAtCurrentMenu.batch10.percent}%) | **R${w.recommendedSellPrice.primary}** |\n`;
  }

  md += `\n### Solo bake (1 box alone — worse electricity)\n\n`;
  md += `| Week | Total cost solo | Margin @ menu | Rec. sell (solo) |\n|------|-----------------|---------------|------------------|\n`;
  for (const w of weeks) {
    md += `| ${w.week} | R${w.costs.totalCashCostSolo.toFixed(2)} | R${w.marginAtCurrentMenu.solo.rand} (${w.marginAtCurrentMenu.solo.percent}%) | R${w.recommendedSellPrice.basedOnSoloBake} |\n`;
  }

  md += `\n## Cost stack (what is included)\n\n`;
  md += `| Layer | What’s in it |\n|-------|----------------|\n`;
  md += `| Ingredients | Recipe amounts × Checkers pack unit cost |\n`;
  md += `| Wastage 5% | Spill, trim, tester bites |\n`;
  md += `| Packaging | Box R${OVERHEAD.packaging.bakeryBox} + liner R${OVERHEAD.packaging.parchmentBags} + label R${OVERHEAD.packaging.stickerLabel} + card R${OVERHEAD.packaging.thankYouCard} + tape R${OVERHEAD.packaging.tapeTwine} |\n`;
  md += `| Electricity | Oven ${OVERHEAD.electricity.ovenKw} kW × hours × R${OVERHEAD.electricity.ratePerKwh}/kWh; batch of 10 uses ${OVERHEAD.electricity.batchOf10Factor * 100}% of solo kWh per box |\n`;
  md += `| Other | Cleaning R${OVERHEAD.otherPerBox.cleaningConsumables} + equipment wear R${OVERHEAD.otherPerBox.equipmentWear} |\n`;
  md += `| Labour | R0 in cash cost (owner time not charged) — add rate in script if you want |\n\n`;

  md += `## Pricing rule used\n\n`;
  md += `- Target ~${OVERHEAD.pricing.targetMarginOnSell * 100}% gross margin on sell price after full cash cost  \n`;
  md += `- And at least ${OVERHEAD.pricing.minMarkupOnCost}× cost  \n`;
  md += `- Round up to nearest R${OVERHEAD.pricing.roundTo}  \n`;
  md += `- **Primary recommended sell** uses **batch-of-10** cost (realistic pilot)  \n\n`;

  for (const w of weeks) {
    md += `## Week ${w.week} — ${w.themeName}\n\n`;
    md += `**Contents:** ${(w.boxContents || []).join("; ")}  \n\n`;
    md += `| Recipe | Ingredient cost |\n|--------|------------------|\n`;
    for (const r of w.recipes) {
      md += `| ${r.name} (${r.yield || ""}) | R${r.ingredientCost.toFixed(2)} |\n`;
    }
    md += `| **Ingredients subtotal** | **R${w.costs.ingredients.toFixed(2)}** |\n`;
    md += `| Wastage 5% | R${w.costs.wastageContingency.toFixed(2)} |\n`;
    md += `| Packaging | R${w.costs.packaging.toFixed(2)} |\n`;
    md += `| Electricity (solo / batch10) | R${w.costs.electricitySolo.toFixed(2)} / R${w.costs.electricityBatch10.toFixed(2)} |\n`;
    md += `| Cleaning + wear | R${w.costs.cleaningAndWear.toFixed(2)} |\n`;
    md += `| **Total cash cost (batch 10)** | **R${w.costs.totalCashCostBatch10.toFixed(2)}** |\n`;
    md += `| Current menu price | R${w.menuPrice} |\n`;
    md += `| **Recommended sell** | **R${w.recommendedSellPrice.primary}** |\n\n`;
  }

  md += `## How to refresh\n\n\`\`\`bash\nnode scripts/build-full-costings.js\n\`\`\`\n\nEdit pack prices in the script or \`data/costings/checkers-prices.json\`, and electricity rate in \`OVERHEAD.electricity.ratePerKwh\`.\n`;

  fs.writeFileSync(MD_PATH, md, "utf8");

  console.log("WROTE", OUT_PATH);
  console.log("WROTE", MD_PATH);
  console.log("\n=== PRIMARY (batch of ~10 boxes) ===");
  for (const w of weeks) {
    console.log(
      `Week ${w.week} ${w.themeName}: cost R${w.costs.totalCashCostBatch10.toFixed(2)} | menu R${w.menuPrice} | margin R${w.marginAtCurrentMenu.batch10.rand} (${w.marginAtCurrentMenu.batch10.percent}%) | REC SELL R${w.recommendedSellPrice.primary}`
    );
  }
  console.log("\n=== SOLO (1 box alone) ===");
  for (const w of weeks) {
    console.log(
      `Week ${w.week}: cost R${w.costs.totalCashCostSolo.toFixed(2)} | rec R${w.recommendedSellPrice.basedOnSoloBake}`
    );
  }
}

main();
