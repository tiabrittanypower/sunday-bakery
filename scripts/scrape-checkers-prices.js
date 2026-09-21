/**
 * Scrape Checkers.co.za search for bakery ingredient pack prices.
 * Writes data/costings/checkers-prices.json
 *
 * Usage: node scripts/scrape-checkers-prices.js
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "costings");
const OUT_FILE = path.join(OUT_DIR, "checkers-prices.json");
const SHOT_DIR = path.join(ROOT, "docs", "research-screens");

/** Catalog of shop packs we search for + how to convert to recipe units */
const CATALOG = [
  {
    key: "cake-flour",
    search: "Snowflake Cake Wheat Flour 2.5kg",
    altSearch: "cake flour 2.5kg",
    packLabel: "Cake flour 2.5 kg",
    packQty: 2500,
    packUnit: "g",
  },
  {
    key: "bread-flour",
    search: "bread flour 2.5kg",
    altSearch: "white bread flour 2.5",
    packLabel: "Bread flour 2.5 kg",
    packQty: 2500,
    packUnit: "g",
  },
  {
    key: "white-sugar",
    search: "Huletts White Sugar 2.5kg",
    altSearch: "white sugar 2.5kg",
    packLabel: "White sugar 2.5 kg",
    packQty: 2500,
    packUnit: "g",
  },
  {
    key: "brown-sugar",
    search: "brown sugar 1kg",
    altSearch: "Huletts brown sugar",
    packLabel: "Brown sugar 1 kg",
    packQty: 1000,
    packUnit: "g",
  },
  {
    key: "castor-sugar",
    search: "castor sugar 500g",
    altSearch: "castor sugar",
    packLabel: "Castor sugar 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "icing-sugar",
    search: "icing sugar 500g",
    altSearch: "icing sugar",
    packLabel: "Icing sugar 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "butter",
    search: "butter 500g",
    altSearch: "Stork Bake 500g",
    packLabel: "Butter 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "milk",
    search: "full cream milk 2l",
    altSearch: "fresh milk 2 litre",
    packLabel: "Milk 2 L",
    packQty: 2000,
    packUnit: "ml",
  },
  {
    key: "cream",
    search: "fresh cream 250ml",
    altSearch: "whipping cream 250ml",
    packLabel: "Cream 250 ml",
    packQty: 250,
    packUnit: "ml",
  },
  {
    key: "eggs",
    search: "eggs large 18",
    altSearch: "large eggs 18 pack",
    packLabel: "Large eggs 18s",
    packQty: 18,
    packUnit: "each",
  },
  {
    key: "egg-yolk",
    search: "eggs large 18",
    altSearch: "large eggs",
    packLabel: "Large eggs 18s (yolk ≈ 1 egg cost)",
    packQty: 18,
    packUnit: "each",
    note: "Costed as 1 large egg per yolk",
  },
  {
    key: "cheddar",
    search: "cheddar cheese 500g",
    altSearch: "cheddar 400g",
    packLabel: "Cheddar ~500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "oil",
    search: "sunflower oil 750ml",
    altSearch: "sunflower oil 2l",
    packLabel: "Sunflower oil 750 ml",
    packQty: 750,
    packUnit: "ml",
  },
  {
    key: "cocoa",
    search: "cocoa powder 250g",
    altSearch: "Cadbury cocoa",
    packLabel: "Cocoa 250 g",
    packQty: 250,
    packUnit: "g",
  },
  {
    key: "chocolate-chips",
    search: "chocolate chips 250g",
    altSearch: "baking chocolate chips",
    packLabel: "Chocolate chips 250 g",
    packQty: 250,
    packUnit: "g",
  },
  {
    key: "chocolate",
    search: "baking chocolate 100g",
    altSearch: "dark chocolate slab 80g",
    packLabel: "Baking / dark chocolate ~100 g",
    packQty: 100,
    packUnit: "g",
  },
  {
    key: "instant-yeast",
    search: "instant yeast 10g",
    altSearch: "Anchor Instant Yeast",
    packLabel: "Instant yeast sachet 10 g",
    packQty: 10,
    packUnit: "g",
  },
  {
    key: "baking-powder",
    search: "baking powder 100g",
    altSearch: "Royal baking powder",
    packLabel: "Baking powder 100 g",
    packQty: 100,
    packUnit: "g",
  },
  {
    key: "bicarb",
    search: "bicarbonate of soda 100g",
    altSearch: "bicarb soda",
    packLabel: "Bicarb 100 g",
    packQty: 100,
    packUnit: "g",
  },
  {
    key: "vanilla",
    search: "vanilla essence 50ml",
    altSearch: "vanilla essence",
    packLabel: "Vanilla essence 50 ml",
    packQty: 50,
    packUnit: "ml",
    recipeUnitNote: "tsp ≈ 5 ml",
  },
  {
    key: "cinnamon",
    search: "ground cinnamon 50g",
    altSearch: "cinnamon powder",
    packLabel: "Ground cinnamon ~50 g",
    packQty: 50,
    packUnit: "g",
    recipeUnitNote: "tsp ≈ 2.5 g",
  },
  {
    key: "ground-ginger",
    search: "ground ginger 50g",
    altSearch: "ginger powder spice",
    packLabel: "Ground ginger ~50 g",
    packQty: 50,
    packUnit: "g",
    recipeUnitNote: "tsp ≈ 2 g",
  },
  {
    key: "apricot-jam",
    search: "apricot jam 450g",
    altSearch: "apricot jam",
    packLabel: "Apricot jam 450 g",
    packQty: 450,
    packUnit: "g",
  },
  {
    key: "raisins",
    search: "raisins 500g",
    altSearch: "seedless raisins",
    packLabel: "Raisins 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "condensed-milk",
    search: "condensed milk 385g",
    altSearch: "Nestle condensed milk",
    packLabel: "Condensed milk 385 g tin",
    packQty: 385,
    packUnit: "g",
  },
  {
    key: "bananas",
    search: "bananas",
    altSearch: "loose bananas",
    packLabel: "Bananas (loose / bunch estimate)",
    packQty: 1000,
    packUnit: "g",
    note: "Often sold per kg or bunch — verify in-store",
  },
  {
    key: "lemons",
    search: "lemons",
    altSearch: "fresh lemons",
    packLabel: "Lemons (each)",
    packQty: 1,
    packUnit: "each",
  },
  {
    key: "lemon-juice",
    search: "lemons",
    altSearch: "lemon juice bottle",
    packLabel: "From lemons / juice",
    packQty: 30,
    packUnit: "ml",
    note: "Approx from 1 lemon juice; linked to lemon price",
    deriveFrom: "lemons",
  },
  {
    key: "sweetcorn",
    search: "sweetcorn tin 410g",
    altSearch: "canned sweetcorn",
    packLabel: "Sweetcorn tin ~410 g",
    packQty: 410,
    packUnit: "g",
  },
  {
    key: "chives",
    search: "fresh chives",
    altSearch: "salad chives",
    packLabel: "Fresh chives bunch",
    packQty: 1,
    packUnit: "bunch",
    recipeUnitNote: "tbsp chopped ≈ 1/4 bunch estimate",
  },
  {
    key: "golden-syrup",
    search: "golden syrup 500g",
    altSearch: "Lyles golden syrup",
    packLabel: "Golden syrup 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "vinegar",
    search: "white vinegar 750ml",
    altSearch: "spirit vinegar",
    packLabel: "White vinegar 750 ml",
    packQty: 750,
    packUnit: "ml",
  },
  {
    key: "salt",
    search: "table salt 1kg",
    altSearch: "salt 1kg",
    packLabel: "Table salt 1 kg",
    packQty: 1000,
    packUnit: "g",
  },
  {
    key: "black-pepper",
    search: "black pepper 100g",
    altSearch: "ground black pepper",
    packLabel: "Black pepper 100 g",
    packQty: 100,
    packUnit: "g",
  },
  {
    key: "oil-maizena",
    search: "maizena 500g",
    altSearch: "cornflour maizena",
    packLabel: "Maizena 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "maizena",
    search: "maizena 500g",
    altSearch: "cornflour",
    packLabel: "Maizena 500 g",
    packQty: 500,
    packUnit: "g",
  },
  {
    key: "foil-tray",
    search: "foil tray",
    altSearch: "aluminium foil containers",
    packLabel: "Foil trays pack",
    packQty: 6,
    packUnit: "each",
    note: "Estimate per tray if multi-pack",
  },
  {
    key: "sauce-jar",
    search: "glass jam jar",
    altSearch: "small glass jars",
    packLabel: "Small glass jar",
    packQty: 1,
    packUnit: "each",
    note: "May need separate packaging supplier",
  },
  {
    key: "water",
    search: null,
    packLabel: "Tap water",
    packQty: 1000,
    packUnit: "ml",
    fixedPrice: 0,
    note: "Tap water — R0",
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRand(text) {
  if (!text) return null;
  // R 45.99 or R45,99 or 45.99
  const m = String(text).replace(/\s/g, " ").match(/R\s*([\d]+[.,]\d{2})/i) ||
    String(text).match(/([\d]+[.,]\d{2})/);
  if (!m) return null;
  return Number(m[1].replace(",", "."));
}

async function dismissModals(page) {
  for (const name of [/accept all/i, /accept/i, /agree/i, /got it/i, /close/i, /no thanks/i]) {
    try {
      await page.getByRole("button", { name }).first().click({ timeout: 1200 });
      await sleep(400);
    } catch {
      /* ignore */
    }
  }
}

async function searchCheckers(page, query) {
  const url =
    "https://www.checkers.co.za/search?searchTerm=" + encodeURIComponent(query);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  await dismissModals(page);
  await sleep(1500);

  // Wait for product cards if present
  try {
    await page.waitForSelector(
      "a[href*='/p/'], [class*='Product'], [class*='product'], article",
      { timeout: 8000 }
    );
  } catch {
    /* continue anyway */
  }

  const products = await page.evaluate(() => {
    const results = [];
    const seen = new Set();

    // Strategy A: product links with price nearby
    document.querySelectorAll("a[href*='/p/'], a[href*='/product']").forEach((a) => {
      const href = a.href || "";
      if (seen.has(href)) return;
      const root =
        a.closest("article") ||
        a.closest("[class*='Product']") ||
        a.closest("li") ||
        a.parentElement;
      const text = ((root && root.innerText) || a.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length < 5 || text.length > 400) return;
      if (!/R\s*\d/i.test(text)) return;
      seen.add(href);
      results.push({ name: text.slice(0, 220), href, source: "link" });
    });

    // Strategy B: any block with R price
    if (results.length === 0) {
      document.querySelectorAll("div, li, article").forEach((el) => {
        if (results.length > 25) return;
        const t = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (t.length < 10 || t.length > 180) return;
        if (!/R\s*\d+[.,]\d{2}/i.test(t)) return;
        if (!/flour|sugar|butter|milk|egg|cocoa|yeast|jam|cheese|oil|cream|banana|lemon|raisin|vinegar|salt|pepper|chocolate|cinnamon|ginger|syrup|maizena|corn|chive|foil|jar|spice|vanilla|bicarb|baking/i.test(t))
          return;
        results.push({ name: t, href: "", source: "block" });
      });
    }

    return results.slice(0, 12);
  });

  // Score products: prefer matching keywords and lower price among sensible packs
  return products.map((p) => {
    const price = parseRand(p.name);
    return { ...p, price };
  });
}

function pickBest(products, item) {
  const withPrice = products.filter((p) => p.price && p.price > 0 && p.price < 500);
  if (!withPrice.length) return null;

  const terms = (item.search || item.altSearch || item.key)
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2 && !/^\d/.test(t));

  let best = null;
  let bestScore = -1;
  for (const p of withPrice) {
    const name = p.name.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (name.includes(t)) score += 2;
    }
    // Prefer mid-range grocery packs over multi-buy confusion
    if (p.price >= 10 && p.price <= 200) score += 1;
    // Prefer first results slightly
    score += Math.max(0, 3 - withPrice.indexOf(p) * 0.2);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    locale: "en-ZA",
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const results = [];
  let shotOnce = false;

  for (const item of CATALOG) {
    if (item.fixedPrice != null) {
      results.push({
        key: item.key,
        search: null,
        packLabel: item.packLabel,
        packQty: item.packQty,
        packUnit: item.packUnit,
        packPrice: item.fixedPrice,
        productName: item.packLabel,
        productUrl: null,
        note: item.note || null,
        status: "fixed",
      });
      console.log("FIXED", item.key, item.fixedPrice);
      continue;
    }

    if (item.deriveFrom) {
      results.push({
        key: item.key,
        search: item.search,
        packLabel: item.packLabel,
        packQty: item.packQty,
        packUnit: item.packUnit,
        packPrice: null,
        deriveFrom: item.deriveFrom,
        note: item.note || null,
        status: "derive",
      });
      console.log("DERIVE", item.key, "from", item.deriveFrom);
      continue;
    }

    console.log("SEARCH", item.key, item.search);
    let products = [];
    try {
      products = await searchCheckers(page, item.search);
      if ((!products || !products.length) && item.altSearch) {
        console.log("  retry", item.altSearch);
        products = await searchCheckers(page, item.altSearch);
      }
      if (!shotOnce) {
        await page.screenshot({
          path: path.join(SHOT_DIR, "checkers-search-sample.png"),
          fullPage: false,
        });
        shotOnce = true;
      }
    } catch (e) {
      console.log("  ERR", e.message);
      results.push({
        key: item.key,
        search: item.search,
        packLabel: item.packLabel,
        packQty: item.packQty,
        packUnit: item.packUnit,
        packPrice: null,
        status: "error",
        error: String(e.message || e),
        note: item.note || null,
      });
      await sleep(1500);
      continue;
    }

    const best = pickBest(products || [], item);
    if (best) {
      console.log("  OK", best.price, best.name.slice(0, 80));
      results.push({
        key: item.key,
        search: item.search,
        packLabel: item.packLabel,
        packQty: item.packQty,
        packUnit: item.packUnit,
        packPrice: best.price,
        productName: best.name.slice(0, 200),
        productUrl: best.href || null,
        note: item.note || null,
        recipeUnitNote: item.recipeUnitNote || null,
        status: "ok",
        candidates: (products || []).slice(0, 5).map((p) => ({
          price: p.price,
          name: (p.name || "").slice(0, 120),
        })),
      });
    } else {
      console.log("  MISS", (products || []).length, "hits");
      results.push({
        key: item.key,
        search: item.search,
        packLabel: item.packLabel,
        packQty: item.packQty,
        packUnit: item.packUnit,
        packPrice: null,
        status: "not_found",
        note: item.note || "Not found on Checkers search — fill manually",
        candidates: (products || []).slice(0, 5),
      });
    }

    // Be polite to Checkers
    await sleep(1800 + Math.random() * 1200);
  }

  // Resolve deriveFrom prices
  const byKey = Object.fromEntries(results.map((r) => [r.key, r]));
  for (const r of results) {
    if (r.status === "derive" && r.deriveFrom && byKey[r.deriveFrom]) {
      const src = byKey[r.deriveFrom];
      if (src.packPrice != null) {
        // lemon juice: ~30ml per lemon → same as 1 lemon cost for 30ml
        r.packPrice = src.packPrice;
        r.productName = "Derived from " + r.deriveFrom;
        r.status = "derived";
      }
    }
  }

  // Manual fallbacks (Gauteng ballpark) if scrape fails — marked clearly
  const FALLBACKS = {
    "cake-flour": 42.99,
    "bread-flour": 39.99,
    "white-sugar": 54.99,
    "brown-sugar": 32.99,
    "castor-sugar": 28.99,
    "icing-sugar": 24.99,
    butter: 64.99,
    milk: 34.99,
    cream: 28.99,
    eggs: 69.99,
    "egg-yolk": 69.99,
    cheddar: 89.99,
    oil: 32.99,
    cocoa: 54.99,
    "chocolate-chips": 45.99,
    chocolate: 24.99,
    "instant-yeast": 8.99,
    "baking-powder": 22.99,
    bicarb: 18.99,
    vanilla: 29.99,
    cinnamon: 24.99,
    "ground-ginger": 24.99,
    "apricot-jam": 34.99,
    raisins: 39.99,
    "condensed-milk": 32.99,
    bananas: 22.99,
    lemons: 4.99,
    "lemon-juice": 4.99,
    sweetcorn: 18.99,
    chives: 19.99,
    "golden-syrup": 39.99,
    vinegar: 19.99,
    salt: 16.99,
    "black-pepper": 29.99,
    maizena: 34.99,
    "foil-tray": 34.99,
    "sauce-jar": 12.99,
  };

  for (const r of results) {
    if ((r.packPrice == null || r.status === "not_found" || r.status === "error") && FALLBACKS[r.key] != null) {
      r.packPrice = FALLBACKS[r.key];
      r.status = r.status === "ok" ? "ok" : "fallback_estimate";
      r.note = (r.note ? r.note + " · " : "") + "Fallback estimate if Checkers scrape missed — verify on site";
    }
  }

  const payload = {
    source: "https://www.checkers.co.za/",
    currency: "ZAR",
    scrapedAt: new Date().toISOString(),
    regionNote: "Online Checkers prices (ZA). May vary by store / promo. Owner kitchen estimates only.",
    items: results,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("WROTE", OUT_FILE);
  console.log(
    "ok",
    results.filter((r) => r.status === "ok" || r.status === "fixed" || r.status === "derived").length,
    "fallback",
    results.filter((r) => r.status === "fallback_estimate").length,
    "miss",
    results.filter((r) => !r.packPrice && r.packPrice !== 0).length
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
