/**
 * Test get-products-filter search body variants after Boksburg address.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "data", "prices", "_search-variants.json");

(async () => {
  console.log("launch");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
    viewport: { width: 1280, height: 900 },
  });
  page.setDefaultTimeout(45000);

  console.log("goto");
  await page.goto("https://www.checkers.co.za/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  for (const sel of [
    'button:has-text("Got it")',
    'button:has-text("Accept")',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 400 })) await b.click();
    } catch (_) {}
  }

  console.log("address");
  await page
    .getByText("Enter your address", { exact: false })
    .first()
    .click({ timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  const addr = page.locator('input[name="address-search"]');
  await addr.waitFor({ state: "visible", timeout: 10000 });
  await addr.click({ force: true });
  await page.keyboard.type("12 Commissioner Street, Boksburg", { delay: 35 });
  await page.waitForTimeout(2500);
  await page
    .locator("text=/12 Commissioner Street, Boksburg/i")
    .first()
    .click({ force: true });
  await page.waitForTimeout(4500);

  const sc = await page.evaluate(async () => {
    const r = await fetch("/api/store/fetch-store-contexts?update=true", {
      credentials: "include",
    });
    return r.json();
  });
  const stores = sc.storeContexts || [];
  const primary = stores[0]
    ? [
        {
          storeId: stores[0].storeId,
          serviceOptionIds: stores[0].serviceOptionIds || [
            "sixty-min-delivery",
          ],
        },
      ]
    : [];
  console.log("primary", JSON.stringify(primary));

  const variants = [
    { search: { term: "cake flour" } },
    { search: { searchTerm: "cake flour" } },
    { searchTerm: "cake flour" },
    { freeTextSearch: { term: "cake flour" } },
    { productSearch: { searchTerm: "cake flour" } },
    { search: { query: "cake flour" } },
    { search: { text: "cake flour" } },
    { searchSource: { term: "cake flour" } },
    { search: { value: "cake flour" } },
    { searchCriteria: { term: "cake flour" } },
    { search: { keywords: "cake flour" } },
    { search: { searchText: "cake flour" } },
  ];

  const out = [];
  for (const productListSource of variants) {
    const body = {
      storeContexts: primary,
      filterData: {
        filter: {
          showAllDisplayVariants: false,
          showNotRangedProducts: false,
          productListSource,
          paginationOptions: { page: 0, pageSize: 10 },
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
      const r = await fetch("/api/catalogue/get-products-filter", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      const products = j.products || [];
      return {
        status: r.status,
        count: products.length,
        total: j.totalCount,
        first: products[0]
          ? {
              name: products[0].name,
              price: products[0].price,
              priceWithoutDecimal: products[0].priceWithoutDecimal,
              priceFactor: products[0].priceFactor,
              unitOfMeasure: products[0].unitOfMeasure,
              keys: Object.keys(products[0]),
            }
          : null,
        sample: products.length ? null : JSON.stringify(j).slice(0, 200),
      };
    }, body);
    console.log(
      JSON.stringify(productListSource),
      "=>",
      res.count,
      res.first && res.first.name
    );
    out.push({ productListSource, res });
    if (res.count > 0) break;
  }

  // Capture real UI search POST body
  const posts = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && /get-products-filter/.test(req.url())) {
      posts.push(req.postData());
    }
  });
  await page.goto(
    "https://www.checkers.co.za/search?Search=" +
      encodeURIComponent("cake flour"),
    { waitUntil: "domcontentloaded", timeout: 60000 }
  );
  await page.waitForTimeout(8000);
  console.log("ui posts", posts.length);
  if (posts.length) console.log(String(posts[posts.length - 1]).slice(0, 1200));

  // Also try intercepting JS bundle for "productListSource" patterns
  // Dump cookies presence
  const cookies = await page.context().cookies();
  console.log(
    "cookies",
    cookies.map((c) => c.name).slice(0, 30)
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ primary, out, posts, cookieNames: cookies.map((c) => c.name) }, null, 2)
  );
  console.log("done", OUT);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
