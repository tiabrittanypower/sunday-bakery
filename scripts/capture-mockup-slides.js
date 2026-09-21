/**
 * Capture live Sunday Bakery screens into docs/mockup-slides/.
 * Uses project Playwright. Orders are closed in config — overlays are forced
 * from the live UI (cart + checkout DOM), not reconstructed cards.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "mockup-slides");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2 };
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };

async function ready(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    document.querySelectorAll(".reveal, [data-reveal]").forEach((el) => {
      el.style.opacity = "1";
      el.classList.add("is-in", "visible");
    });
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: "png" });
  console.log("SHOT " + file);
}

async function forceCart(page) {
  await page.evaluate(() => {
    if (typeof config === "object" && config) {
      config.availability = {
        canOrder: true,
        soldOut: false,
        ordersOpen: true,
        remaining: 8,
        maxPerOrder: 2,
        percentSpokenFor: 25,
      };
    }
    cart = { box: 1 };
    if (typeof saveCart === "function") saveCart();
    else {
      localStorage.setItem("sunday-bakery-cart", JSON.stringify({ box: 1 }));
      if (typeof renderCart === "function") renderCart();
    }
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const phone = await browser.newContext({
    viewport: { width: PHONE.width, height: PHONE.height },
    deviceScaleFactor: PHONE.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  });
  const p = await phone.newPage();

  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await ready(p);
  await p.waitForSelector("[data-products] .product, [data-products] article, .product", {
    timeout: 15000,
  }).catch(() => {});
  await shot(p, "01-home.png");

  await p.evaluate(() => {
    const el = document.querySelector("#menu");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await p.waitForTimeout(500);
  await shot(p, "02-menu.png");

  await p.evaluate(() => {
    const el = document.querySelector("#about");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await p.waitForTimeout(400);
  await shot(p, "03-story.png");

  await p.evaluate(() => {
    const el = document.querySelector("#faq");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await p.waitForTimeout(400);
  await shot(p, "04-faq.png");

  await p.evaluate(() => window.scrollTo(0, 0));
  await forceCart(p);
  await p.click("[data-open-cart]");
  await p.waitForTimeout(500);
  await shot(p, "05-basket.png");

  await p.evaluate(() => {
    if (typeof openCheckout === "function") openCheckout();
  });
  await p.waitForTimeout(500);
  await shot(p, "06-checkout.png");

  await p.evaluate(() => {
    if (typeof showConfirmation === "function") {
      showConfirmation({
        id: "SUN-DEMO01",
        firstName: "Tia",
        email: "hello@sundaybakery.co.za",
        collectionLabel: "Sunday, 26 July",
        slot: "09:00–09:30",
        collectionAddress: "Boksburg / Kempton Park",
        total: 245,
      });
    }
  });
  await p.waitForTimeout(400);
  await shot(p, "07-confirmed.png");

  await p.goto(BASE + "/order-cancelled.html", { waitUntil: "networkidle", timeout: 30000 });
  await ready(p);
  await shot(p, "08-cancelled.png");

  await phone.close();

  const desk = await browser.newContext({
    viewport: { width: DESKTOP.width, height: DESKTOP.height },
    deviceScaleFactor: DESKTOP.deviceScaleFactor,
  });
  const d = await desk.newPage();
  await d.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await ready(d);
  await shot(d, "09-home-desktop.png");

  await d.goto(BASE + "/dashboard.html", { waitUntil: "networkidle", timeout: 45000 });
  await ready(d);
  await d.waitForFunction(() => {
    const t = document.getElementById("theme-title");
    return t && t.textContent && t.textContent.trim() !== "—";
  }, { timeout: 15000 }).catch(() => {});
  await d.waitForTimeout(600);
  await shot(d, "10-dashboard.png");

  await desk.close();
  await browser.close();
  console.log("DONE " + OUT);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
