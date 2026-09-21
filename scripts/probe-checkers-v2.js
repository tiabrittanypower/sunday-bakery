/**
 * Deeper Checkers probe: address autocomplete + network capture.
 */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const apiHits = [];
  page.on("response", async (res) => {
    try {
      const u = res.url();
      if (!/api|graphql|search|product|store|location|address|fulfilisearch|catalog/i.test(u))
        return;
      if (res.status() >= 400) return;
      const ct = (res.headers()["content-type"] || "").toLowerCase();
      if (!ct.includes("json") && !ct.includes("text")) return;
      let body = null;
      try {
        body = await res.json();
      } catch {
        try {
          body = (await res.text()).slice(0, 500);
        } catch {
          body = null;
        }
      }
      apiHits.push({
        url: u.slice(0, 250),
        status: res.status(),
        sample:
          typeof body === "string"
            ? body
            : JSON.stringify(body).slice(0, 400),
      });
    } catch (_) {}
  });

  await page.goto("https://www.checkers.co.za/", {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);

  for (const sel of [
    'button:has-text("Got it")',
    'button:has-text("Accept")',
    'button:has-text("Continue Shopping")',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 800 })) await b.click();
    } catch (_) {}
  }

  // Open address UI
  try {
    await page.getByText("Enter your address", { exact: false }).first().click({ timeout: 5000 });
  } catch {
    try {
      await page.getByText("Delivering to").first().click({ timeout: 3000 });
    } catch (_) {}
  }
  await page.waitForTimeout(1000);

  const addr = page.locator('input[name="address-search"]');
  await addr.waitFor({ state: "visible", timeout: 10000 });
  await addr.click({ force: true });
  await addr.fill("");
  await page.keyboard.type("12 Commissioner Street, Boksburg", { delay: 60 });
  await page.waitForTimeout(3500);

  // Log suggestion DOM
  const sugInfo = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll(
        '[role="listbox"] *, [role="option"], li, div[class*="suggest"], div[class*="option"], div[class*="result"]'
      )
    );
    return nodes
      .map((n) => (n.innerText || "").trim().replace(/\s+/g, " "))
      .filter((t) => t.length > 8 && t.length < 160)
      .slice(0, 20);
  });
  console.log("SUGGESTIONS", JSON.stringify(sugInfo, null, 2));

  // Try ArrowDown + Enter
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);

  // Click first option-like row containing Boksburg
  try {
    const opt = page.locator("text=/Boksburg/i").first();
    if (await opt.isVisible({ timeout: 2000 })) {
      await opt.click({ force: true });
      console.log("clicked Boksburg option");
      await page.waitForTimeout(2000);
    }
  } catch (_) {}

  for (const sel of [
    'button:has-text("Confirm")',
    'button:has-text("Save address")',
    'button:has-text("Save")',
    'button:has-text("Continue")',
    'button:has-text("Start shopping")',
    'button:has-text("Shop now")',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 800 })) {
        await b.click();
        console.log("btn", sel);
        await page.waitForTimeout(1500);
      }
    } catch (_) {}
  }

  // Screenshot-free dump of visible text after address attempt
  const afterAddr = await page.evaluate(() =>
    (document.body.innerText || "").slice(0, 1200)
  );
  console.log("AFTER_ADDR_SNIPPET\n", afterAddr);

  // Search
  await page.goto(
    "https://www.checkers.co.za/search?q=" + encodeURIComponent("cake flour"),
    { waitUntil: "networkidle", timeout: 90000 }
  );
  await page.waitForTimeout(4000);

  const searchSnap = await page.evaluate(() => {
    const body = document.body.innerText || "";
    return {
      prices: (body.match(/R\s?\d+[.,]\d{2}/g) || []).slice(0, 40),
      hasResults: !/0 RESULT|No products found/i.test(body),
      snippet: body.slice(0, 1800),
    };
  });
  console.log("SEARCH", JSON.stringify(searchSnap, null, 2));
  console.log(
    "API_HITS",
    JSON.stringify(apiHits.slice(0, 40), null, 2)
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
