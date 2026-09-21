/**
 * Capture request bodies + headers for get-products-filter after address set.
 * Then try search with discovered pattern.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "data", "prices", "_probe-req.json");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const captures = [];
  page.on("request", (req) => {
    const u = req.url();
    if (!/checkers\.co\.za\/api\/catalogue/i.test(u)) return;
    captures.push({
      kind: "req",
      method: req.method(),
      url: u,
      headers: req.headers(),
      postData: req.postData() || null,
    });
  });
  page.on("response", async (res) => {
    const u = res.url();
    if (!/checkers\.co\.za\/api\/catalogue/i.test(u)) return;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    captures.push({
      kind: "res",
      status: res.status(),
      url: u,
      productCount:
        body && Array.isArray(body.products) ? body.products.length : null,
      firstProduct:
        body && body.products && body.products[0]
          ? {
              name: body.products[0].name || body.products[0].displayName,
              price:
                body.products[0].price ??
                body.products[0].sellingPrice ??
                body.products[0].currentPrice ??
                body.products[0].priceObject ??
                null,
              keys: Object.keys(body.products[0]).slice(0, 40),
            }
          : null,
      keys: body ? Object.keys(body).slice(0, 20) : null,
    });
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

  // Address
  await page
    .getByText("Enter your address", { exact: false })
    .first()
    .click({ timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(600);
  const addr = page.locator('input[name="address-search"]');
  await addr.waitFor({ state: "visible", timeout: 15000 });
  await addr.click({ force: true });
  await page.keyboard.type("12 Commissioner Street, Boksburg", { delay: 45 });
  await page.waitForTimeout(2800);
  await page
    .locator("text=/12 Commissioner Street, Boksburg/i")
    .first()
    .click({ force: true });
  console.log("address selected");
  await page.waitForTimeout(5000);

  // Confirm delivery slots visible = store set
  const snippet = await page.evaluate(() =>
    (document.body.innerText || "").slice(0, 400)
  );
  console.log("home", snippet.replace(/\n/g, " | "));

  // Navigate baking / groceries if possible
  try {
    await page.getByText("Groceries", { exact: true }).first().click({ timeout: 3000 });
    await page.waitForTimeout(4000);
  } catch (_) {}

  // Search via capital Search param after store cookies exist
  await page.goto(
    "https://www.checkers.co.za/search?Search=" + encodeURIComponent("cake flour"),
    { waitUntil: "domcontentloaded", timeout: 90000 }
  );
  await page.waitForTimeout(7000);

  const searchUi = await page.evaluate(() => {
    const body = document.body.innerText || "";
    return {
      url: location.href,
      prices: (body.match(/R\s?\d+[.,]\d{2}/g) || []).slice(0, 20),
      resultLine: (body.match(/\d+\s+RESULT[S]?.*\n?/i) || [])[0] || null,
      hasNo: /No products found|0 RESULT/i.test(body),
    };
  });
  console.log("searchUi", searchUi);

  // Try fetch with cookies inside page for known endpoints
  const tryFetch = await page.evaluate(async () => {
    const endpoints = [
      "/api/catalogue/get-products-filter",
      "/api/catalogue/get-search-products",
      "/api/catalogue/search",
      "/api/catalogue/get-products",
      "/api/catalogue/get-product-search",
      "/api/search/products",
    ];
    const bodies = [
      null,
      { searchTerm: "cake flour", pageSize: 12, pageNumber: 0 },
      { Search: "cake flour", pageSize: 12 },
      { term: "cake flour", limit: 12 },
      { query: "cake flour", size: 12 },
      {
        filters: [],
        search: "cake flour",
        pagination: { pageNumber: 0, pageSize: 12 },
      },
      {
        productIds: [],
        excludeProductIds: [],
        sortOption: null,
        filterOptions: [],
        pageSize: 12,
        pageNumber: 0,
        searchTerm: "cake flour",
      },
    ];
    const results = [];
    for (const url of endpoints) {
      for (const body of bodies) {
        for (const method of body ? ["POST", "GET"] : ["GET"]) {
          try {
            let finalUrl = url;
            const opts = {
              method,
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              credentials: "include",
            };
            if (method === "GET" && body) {
              finalUrl =
                url +
                "?" +
                new URLSearchParams(
                  Object.fromEntries(
                    Object.entries(body).map(([k, v]) => [
                      k,
                      typeof v === "object" ? JSON.stringify(v) : String(v),
                    ])
                  )
                ).toString();
            } else if (method === "POST" && body) {
              opts.body = JSON.stringify(body);
            }
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 8000);
            opts.signal = ctrl.signal;
            const r = await fetch(finalUrl, opts);
            clearTimeout(t);
            const text = await r.text();
            if (r.status === 404 || r.status === 405) continue;
            if (text.includes("Cannot ") && text.length < 80) continue;
            results.push({
              method,
              url: finalUrl.slice(0, 120),
              status: r.status,
              sample: text.slice(0, 350),
            });
            if (results.length >= 12) return results;
          } catch (e) {
            /* skip */
          }
        }
      }
    }
    return results;
  });
  console.log("tryFetch", JSON.stringify(tryFetch, null, 2));

  // Save captures (trim headers)
  const slim = captures.map((c) => {
    if (c.kind === "req") {
      return {
        kind: c.kind,
        method: c.method,
        url: c.url,
        postData: c.postData,
        interestingHeaders: {
          cookie: c.headers.cookie ? "(present)" : "",
          "x-store-id": c.headers["x-store-id"],
          "x-storeid": c.headers["x-storeid"],
          "store-id": c.headers["store-id"],
          authorization: c.headers.authorization ? "(present)" : "",
        },
      };
    }
    return c;
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ searchUi, tryFetch, captures: slim }, null, 2));
  console.log("wrote", OUT, "captures", slim.length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
