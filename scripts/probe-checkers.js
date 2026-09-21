/**
 * One-off probe: open Checkers search and dump product card structure.
 * Usage: node scripts/probe-checkers.js "cake flour"
 */
const { chromium } = require("playwright");

const q = process.argv[2] || "cake flour";
const searchUrl =
  "https://www.checkers.co.za/search?q=" + encodeURIComponent(q);

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-ZA",
  });
  page.setDefaultTimeout(45000);
  console.log("goto", searchUrl);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);

  // Cookie / age / region banners
  for (const sel of [
    'button:has-text("Accept")',
    'button:has-text("I accept")',
    'button:has-text("Got it")',
    'button:has-text("Allow")',
    '[aria-label="Close"]',
  ]) {
    try {
      const b = page.locator(sel).first();
      if (await b.isVisible({ timeout: 800 })) await b.click({ timeout: 1000 });
    } catch (_) {}
  }

  const title = await page.title();
  const url = page.url();
  console.log("title", title);
  console.log("url", url);

  const info = await page.evaluate(() => {
    const text = (el) => (el && el.textContent ? el.textContent.trim().replace(/\s+/g, " ") : "");
    const candidates = [];
    const selectors = [
      "[data-product]",
      "[data-testid*='product']",
      ".product-card",
      ".product-list-item",
      "article",
      "li",
      "a[href*='/p/']",
      "a[href*='product']",
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length) {
        candidates.push({ sel, count: nodes.length, sample: text(nodes[0]).slice(0, 200) });
      }
    }
    // Price-like text
    const body = document.body ? document.body.innerText : "";
    const priceHits = (body.match(/R\s?\d+[.,]\d{2}/g) || []).slice(0, 20);
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href") || "")
      .filter((h) => /product|p\/|item/i.test(h))
      .slice(0, 15);
    return {
      priceHits,
      links,
      candidates,
      bodySnippet: body.slice(0, 1500),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => {
  console.error("PROBE_FAIL", e && e.message ? e.message : e);
  process.exit(1);
});
