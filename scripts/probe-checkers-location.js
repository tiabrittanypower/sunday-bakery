/**
 * Probe Checkers with East Rand address so products resolve.
 */
const { chromium } = require("playwright");

const ADDRESS_QUERY = process.argv[2] || "Boksburg";

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
    geolocation: { latitude: -26.2124, longitude: 28.2597 }, // Boksburg-ish
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  await page.goto("https://www.checkers.co.za/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2500);

  // Dismiss common banners
  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("I accept")',
    'button:has-text("Got it")',
    'button:has-text("Allow all")',
    'button:has-text("Continue Shopping")',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 600 })) await b.click({ timeout: 1500 });
    } catch (_) {}
  }

  // Try open address / delivery
  const addressTriggers = [
    'text=Enter your address',
    'text=Delivering to',
    '[data-testid*="address"]',
    'button:has-text("address")',
    'text=Select your location',
  ];
  for (const t of addressTriggers) {
    try {
      const el = page.locator(t).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.click({ timeout: 2000 });
        console.log("clicked trigger", t);
        break;
      }
    } catch (_) {}
  }
  await page.waitForTimeout(1500);

  // Type address in any visible input
  const inputs = page.locator(
    'input[type="text"], input[type="search"], input[placeholder*="address" i], input[placeholder*="suburb" i], input[placeholder*="street" i]'
  );
  const n = await inputs.count();
  console.log("text inputs", n);
  for (let i = 0; i < Math.min(n, 6); i++) {
    const inp = inputs.nth(i);
    try {
      if (!(await inp.isVisible({ timeout: 500 }))) continue;
      const ph = (await inp.getAttribute("placeholder")) || "";
      const name = (await inp.getAttribute("name")) || "";
      const id = (await inp.getAttribute("id")) || "";
      console.log("input", i, { ph, name, id });
      await inp.click({ timeout: 1000 });
      await inp.fill(ADDRESS_QUERY);
      await page.waitForTimeout(2000);
      // click first suggestion
      const sug = page.locator(
        '[role="option"], li[class*="suggest"], .pac-item, [class*="suggestion"], [class*="autocomplete"] li, ul li'
      );
      if (await sug.first().isVisible({ timeout: 2500 })) {
        const st = await sug.first().innerText();
        console.log("suggestion", st.slice(0, 120));
        await sug.first().click();
        await page.waitForTimeout(2000);
      }
      break;
    } catch (e) {
      console.log("input fail", i, e.message);
    }
  }

  // Confirm / save buttons
  for (const sel of [
    'button:has-text("Confirm")',
    'button:has-text("Save")',
    'button:has-text("Continue")',
    'button:has-text("Shop")',
    'button:has-text("Select")',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 800 })) {
        await b.click({ timeout: 1500 });
        console.log("clicked", sel);
        await page.waitForTimeout(1500);
      }
    } catch (_) {}
  }

  // Search flour
  const searchUrl =
    "https://www.checkers.co.za/search?q=" + encodeURIComponent("cake flour");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);

  const snap = await page.evaluate(() => {
    const body = document.body ? document.body.innerText : "";
    const prices = (body.match(/R\s?\d+[.,]\d{2}/g) || []).slice(0, 30);
    // Collect product-like blocks
    const cards = [];
    document.querySelectorAll("a, article, li, div").forEach((el) => {
      const t = (el.innerText || "").trim().replace(/\s+/g, " ");
      if (
        t.length > 10 &&
        t.length < 220 &&
        /flour|R\s?\d/i.test(t) &&
        /R\s?\d+[.,]\d{2}/.test(t)
      ) {
        cards.push(t.slice(0, 200));
      }
    });
    return {
      url: location.href,
      title: document.title,
      prices,
      cards: [...new Set(cards)].slice(0, 15),
      snippet: body.slice(0, 2000),
    };
  });

  console.log(JSON.stringify(snap, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
