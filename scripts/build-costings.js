/**
 * Build per-box costings from recipes + checkers-prices.json
 * Output: data/costings/box-costings.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RECIPES = path.join(ROOT, "data", "recipes", "month-1.json");
const PRICES = path.join(ROOT, "data", "costings", "checkers-prices.json");
const OUT = path.join(ROOT, "data", "costings", "box-costings.json");

/** Convert recipe amount to the pack's base unit for unit cost. */
function toBaseAmount(amount, unit, priceItem) {
  const a = Number(amount) || 0;
  const u = String(unit || "").toLowerCase();
  const packUnit = String(priceItem.packUnit || "").toLowerCase();

  // Same unit
  if (u === packUnit) return a;

  // Eggs / each
  if (u === "each" && packUnit === "each") return a;
  if (u === "egg" || u === "eggs") return a;

  // Volume mass approx
  if (u === "ml" && packUnit === "ml") return a;
  if (u === "g" && packUnit === "g") return a;

  // tsp / tbsp → ml or g depending on ingredient
  if (u === "tsp") {
    if (packUnit === "ml") return a * 5;
    if (packUnit === "g") {
      // spices ~2.5g per tsp; baking powder ~4g; salt ~6g; bicarb ~4.5g
      if (priceItem.key === "cinnamon" || priceItem.key === "ground-ginger") return a * 2.5;
      if (priceItem.key === "bicarb" || priceItem.key === "baking-powder") return a * 4;
      if (priceItem.key === "vanilla") return a * 5; // if vanilla was g
      if (priceItem.key === "salt") return a * 6;
      return a * 4;
    }
  }
  if (u === "tbsp") {
    if (packUnit === "ml") return a * 15;
    if (packUnit === "g") {
      if (priceItem.key === "cocoa") return a * 7;
      if (priceItem.key === "apricot-jam" || priceItem.key === "golden-syrup") return a * 20;
      if (priceItem.key === "white-sugar") return a * 12;
      if (priceItem.key === "butter") return a * 14;
      if (priceItem.key === "maizena" || priceItem.key === "cake-flour") return a * 8;
      return a * 12;
    }
  }

  // pinch
  if (u === "pinch") {
    if (packUnit === "g") return a * 0.3; // ~0.3g per pinch
    return 0; // negligible
  }

  // tin condensed milk: recipe may use g or tin fraction
  if (u === "tin" && priceItem.key === "condensed-milk") {
    return a * (priceItem.packQty || 385);
  }

  // chives: tbsp vs bunch
  if (priceItem.key === "chives" && u === "tbsp") {
    return a * 0.25; // 1 tbsp ≈ 1/4 bunch
  }

  // foil tray pack of 6
  if (u === "each" && packUnit === "each") return a;

  // fallback: treat as same
  return a;
}

function unitCost(priceItem) {
  if (!priceItem || priceItem.packPrice == null) return null;
  const qty = Number(priceItem.packQty) || 0;
  if (qty <= 0) return null;
  return Number(priceItem.packPrice) / qty;
}

function costLine(ing, priceByKey) {
  const item = priceByKey[ing.key];
  if (!item || item.packPrice == null) {
    return {
      key: ing.key,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      cost: null,
      missing: true,
    };
  }
  const baseAmt = toBaseAmount(ing.amount, ing.unit, item);
  const uc = unitCost(item);
  const cost = uc == null ? null : Math.round(baseAmt * uc * 100) / 100;
  return {
    key: ing.key,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    cost,
    packLabel: item.packLabel,
    packPrice: item.packPrice,
    unitCost: uc != null ? Math.round(uc * 10000) / 10000 : null,
    priceStatus: item.status,
    productName: item.productName || null,
    missing: cost == null,
  };
}

function main() {
  if (!fs.existsSync(PRICES)) {
    console.error("Missing", PRICES, "— run scrape-checkers-prices.js first");
    process.exit(1);
  }
  const recipes = JSON.parse(fs.readFileSync(RECIPES, "utf8"));
  const prices = JSON.parse(fs.readFileSync(PRICES, "utf8"));
  const priceByKey = {};
  for (const it of prices.items || []) {
    priceByKey[it.key] = it;
  }

  const weeks = (recipes.weeks || []).map((week) => {
    const recipesOut = (week.recipes || []).map((recipe) => {
      const lines = (recipe.ingredients || []).map((ing) => costLine(ing, priceByKey));
      const known = lines.filter((l) => l.cost != null);
      const missing = lines.filter((l) => l.missing);
      const total = known.reduce((s, l) => s + l.cost, 0);
      return {
        id: recipe.id,
        name: recipe.name,
        image: recipe.image || null,
        ingredientCost: Math.round(total * 100) / 100,
        missingCount: missing.length,
        lines,
      };
    });

    const boxCost = recipesOut.reduce((s, r) => s + (r.ingredientCost || 0), 0);
    const sell = Number(week.price) || 0;
    const margin = sell - boxCost;
    const marginPct = sell > 0 ? Math.round((margin / sell) * 1000) / 10 : null;

    // Consolidated shopping cost for 1 box
    const shopMap = {};
    for (const r of recipesOut) {
      for (const l of r.lines) {
        if (l.cost == null) continue;
        const k = l.key + "::" + l.unit;
        if (!shopMap[k]) {
          shopMap[k] = {
            key: l.key,
            name: l.name,
            unit: l.unit,
            amount: 0,
            cost: 0,
          };
        }
        shopMap[k].amount += Number(l.amount) || 0;
        shopMap[k].cost += l.cost;
      }
    }
    const shopping = Object.values(shopMap).map((x) => ({
      ...x,
      cost: Math.round(x.cost * 100) / 100,
    }));

    return {
      week: week.week,
      themeName: week.themeName,
      sellPrice: sell,
      boxIngredientCost: Math.round(boxCost * 100) / 100,
      grossMargin: Math.round(margin * 100) / 100,
      marginPercent: marginPct,
      recipes: recipesOut,
      shoppingPerBox: shopping,
    };
  });

  const payload = {
    source: prices.source,
    currency: "ZAR",
    pricesScrapedAt: prices.scrapedAt,
    builtAt: new Date().toISOString(),
    disclaimer:
      "Estimates from Checkers online packs divided by pack size. Promos, store stock, and waste not included. Packaging boxes/labels extra unless listed.",
    weeks,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log("WROTE", OUT);
  for (const w of weeks) {
    console.log(
      `Week ${w.week} ${w.themeName}: cost R${w.boxIngredientCost} · sell R${w.sellPrice} · margin R${w.grossMargin} (${w.marginPercent}%)`
    );
  }
}

main();
