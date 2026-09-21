/**
 * After setting Boksburg address, try catalogue search APIs + UI search.
 */
const { chromium } = require("playwright");

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

  const searchApis = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (!/checkers\.co\.za\/api/i.test(u)) return;
    let sample = "";
    try {
      const j = await res.json();
      sample = JSON.stringify(j).slice(0, 600);
    } catch {
      try {
        sample = (await res.text()).slice(0, 200);
      } catch (_) {}
    }
    searchApis.push({ url: u, status: res.status(), sample });
  });

  await page.goto("https://www.checkers.co.za/", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
  for (const sel of ['button:has-text("Got it")', 'button:has-text("Accept")']) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 600 })) await b.click();
    } catch (_) {}
  }

  await page.getByText("Enter your address", { exact: false }).first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  const addr = page.locator('input[name="address-search"]');
  await addr.waitFor({ state: "visible", timeout: 10000 });
  await addr.click({ force: true });
  await page.keyboard.type("12 Commissioner Street, Boksburg", { delay: 50 });
  await page.waitForTimeout(3000);
  await page.locator("text=/12 Commissioner Street, Boksburg/i").first().click({ force: true });
  await page.waitForTimeout(4000);

  // Use search box on site
  const search = page.locator("#search-input, input[placeholder*='Search products']").first();
  await search.click({ force: true });
  await search.fill("");
  await page.keyboard.type("cake flour", { delay: 40 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(6000);

  const ui = await page.evaluate(() => {
    const body = document.body.innerText || "";
    return {
      url: location.href,
      prices: (body.match(/R\s?\d+[.,]\d{2}/g) || []).slice(0, 30),
      hasResults: !/0 RESULT|No products found/i.test(body),
      snippet: body.slice(0, 2000),
    };
  });
  console.log("UI", JSON.stringify(ui, null, 2));

  // Direct API attempts in page context (cookies + store)
  const apiTests = await page.evaluate(async () => {
    const tries = [
      { method: "GET", url: "/api/catalogue/get-search-suggestions?term=cake%20flour" },
      { method: "GET", url: "/api/catalogue/search?q=cake%20flour" },
      { method: "GET", url: "/api/catalogue/search-products?searchTerm=cake%20flour" },
      { method: "GET", url: "/api/search?q=cake%20flour" },
      {
        method: "POST",
        url: "/api/catalogue/get-products-filter",
        body: {
          searchTerm: "cake flour",
          pageSize: 10,
          pageNumber: 0,
        },
      },
      {
        method: "POST",
        url: "/api/catalogue/get-products-filter",
        body: {
          filters: { search: "cake flour" },
          pageSize: 10,
        },
      },
      {
        method: "POST",
        url: "/api/catalogue/get-products-filter",
        body: { term: "cake flour", size: 10 },
      },
    ];
    const out = [];
    for (const t of tries) {
      try {
        const opts = {
          method: t.method,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
        };
        if (t.body) opts.body = JSON.stringify(t.body);
        const r = await fetch(t.url, opts);
        const text = await r.text();
        out.push({
          try: t.url + " " + t.method,
          status: r.status,
          sample: text.slice(0, 500),
        });
      } catch (e) {
        out.push({ try: t.url, error: String(e.message || e) });
      }
    }
    return out;
  });
  console.log("API_TESTS", JSON.stringify(apiTests, null, 2));

  // Print only catalogue-related hits
  const cat = searchApis.filter((a) =>
    /catalogue|search|product/i.test(a.url)
  );
  console.log("CAPTURED", JSON.stringify(cat.slice(-20), null, 2));

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
