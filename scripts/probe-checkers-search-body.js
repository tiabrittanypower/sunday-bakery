/**
 * Discover get-products-filter body that returns search results.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "data", "prices", "_probe-search-body.json");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
    viewport: { width: 1280, height: 900 },
  });
  page.setDefaultTimeout(60000);

  // Capture live search filter posts from UI if any appear
  const livePosts = [];
  page.on("request", (req) => {
    if (!/get-products-filter/i.test(req.url())) return;
    if (req.method() !== "POST") return;
    livePosts.push(req.postData());
  });

  await page.goto("https://www.checkers.co.za/", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(1500);
  for (const sel of ['button:has-text("Got it")', 'button:has-text("Accept")']) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 500 })) await b.click();
    } catch (_) {}
  }

  await page
    .getByText("Enter your address", { exact: false })
    .first()
    .click({ timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  const addr = page.locator('input[name="address-search"]');
  await addr.waitFor({ state: "visible", timeout: 15000 });
  await addr.click({ force: true });
  await page.keyboard.type("12 Commissioner Street, Boksburg", { delay: 40 });
  await page.waitForTimeout(2800);
  await page
    .locator("text=/12 Commissioner Street, Boksburg/i")
    .first()
    .click({ force: true });
  await page.waitForTimeout(5000);

  // Fetch store contexts
  const storeContexts = await page.evaluate(async () => {
    const r = await fetch("/api/store/fetch-store-contexts?update=true", {
      credentials: "include",
    });
    return r.json();
  });
  console.log(
    "stores",
    (storeContexts.storeContexts || []).slice(0, 3).map((s) => s.storeId)
  );

  const stores = storeContexts.storeContexts || [];
  const primary = stores[0]
    ? [
        {
          storeId: stores[0].storeId,
          serviceOptionIds: stores[0].serviceOptionIds || ["sixty-min-delivery"],
        },
      ]
    : [];

  const term = "cake flour";
  const sourceVariants = [
    { search: { term } },
    { search: { searchTerm: term } },
    { searchTerm: term },
    { search: term },
    { query: term },
    { productSearch: { term } },
    { productSearch: { searchTerm: term } },
    { freeTextSearch: { term } },
    { freeText: term },
    { searchQuery: term },
    { search: { query: term, term } },
    { search: { text: term } },
    { searchSource: { term } },
    {
      search: {
        searchTerm: term,
        correctedSearchTerm: term,
      },
    },
    {
      productList: null,
      search: { term },
    },
  ];

  const results = [];
  for (const productListSource of sourceVariants) {
    const body = {
      storeContexts: primary,
      filterData: {
        filter: {
          showAllDisplayVariants: false,
          showNotRangedProducts: false,
          productListSource,
          paginationOptions: { page: 0, pageSize: 12 },
          filterOptions: {
            dealsOnly: false,
            serviceOptions: [],
            facetOptions: [],
          },
          sortOptions: null,
        },
        displayOptions: {},
      },
      forYouBonusBuyIds: [],
      url: "/api/v3/products/search",
      isCarousel: false,
    };

    const res = await page.evaluate(async (payload) => {
      try {
        const r = await fetch("/api/catalogue/get-products-filter", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const text = await r.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        const products = (json && json.products) || [];
        return {
          status: r.status,
          totalCount: json && json.totalCount,
          count: products.length,
          first: products[0]
            ? {
                name: products[0].name,
                price: products[0].price,
                priceWithoutDecimal: products[0].priceWithoutDecimal,
                priceFactor: products[0].priceFactor,
                unitOfMeasure: products[0].unitOfMeasure,
                size: products[0].size || products[0].packSize || null,
                longDescription: (products[0].longDescription || "").slice(0, 80),
                displayName: products[0].displayName,
              }
            : null,
          errSample: products.length ? null : text.slice(0, 200),
        };
      } catch (e) {
        return { error: String(e.message || e) };
      }
    }, body);

    results.push({ productListSource, res });
    console.log(
      JSON.stringify(productListSource).slice(0, 80),
      "=>",
      res.count || res.status,
      res.first && res.first.name
    );
    if (res.count > 0) break;
  }

  // Also try url variants with a known working productList id vs search
  const urlVariants = [
    "/api/v3/products/search",
    "/api/v3/products/product-search",
    "/api/v3/products/product-list-page",
    "/search",
  ];
  for (const url of urlVariants) {
    const body = {
      storeContexts: primary,
      filterData: {
        filter: {
          showAllDisplayVariants: false,
          showNotRangedProducts: false,
          productListSource: { search: { term } },
          paginationOptions: { page: 0, pageSize: 12 },
          filterOptions: {
            dealsOnly: false,
            serviceOptions: [],
            facetOptions: [],
          },
          sortOptions: null,
        },
        displayOptions: {},
      },
      forYouBonusBuyIds: [],
      url,
      isCarousel: false,
    };
    const res = await page.evaluate(async (payload) => {
      const r = await fetch("/api/catalogue/get-products-filter", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await r.json().catch(() => ({}));
      return {
        status: r.status,
        count: (json.products || []).length,
        first: (json.products || [])[0] && (json.products || [])[0].name,
      };
    }, body);
    console.log("url", url, res);
    results.push({ url, res });
  }

  // Type in search box and press Enter to capture real body
  try {
    const search = page.locator("#search-input").first();
    await search.click({ force: true });
    await search.fill("");
    await page.keyboard.type("butter", { delay: 50 });
    await page.waitForTimeout(1500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(6000);
  } catch (e) {
    console.log("ui search fail", e.message);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ primary, results, livePosts: livePosts.slice(0, 20) }, null, 2)
  );
  console.log("livePosts", livePosts.length);
  if (livePosts[0]) console.log("live0", livePosts[0].slice(0, 800));
  console.log("wrote", OUT);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
