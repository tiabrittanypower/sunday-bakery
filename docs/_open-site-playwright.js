const { chromium } = require("playwright");
const http = require("http");
const url = process.argv[2] || "http://127.0.0.1:3000/";
const CDP = "http://127.0.0.1:9334"; // separate from overview 9333
function cdpOk() {
  return new Promise((r) => {
    const q = http.get(CDP + "/json/version", (res) => {
      res.resume();
      r(res.statusCode < 500);
    });
    q.on("error", () => r(false));
    q.setTimeout(600, () => {
      try {
        q.destroy();
      } catch {}
      r(false);
    });
  });
}
(async () => {
  let browser = null;
  let launched = false;
  if (await cdpOk()) {
    try {
      browser = await chromium.connectOverCDP(CDP, { timeout: 5000 });
    } catch {}
  }
  if (!browser) {
    browser = await chromium.launch({
      channel: "chrome",
      headless: false,
      args: ["--start-maximized", "--remote-debugging-port=9334"],
    });
    launched = true;
  }
  const ctx = browser.contexts()[0] || (await browser.newContext({ viewport: null }));
  let page = null;
  for (const c of browser.contexts()) {
    for (const p of c.pages()) {
      const u = p.url();
      if (/127\.0\.0\.1:3000|localhost:3000/i.test(u)) {
        page = p;
        break;
      }
    }
    if (page) break;
  }
  if (page) {
    await page.bringToFront();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log("playwright-chrome-refresh " + url + " title=" + (await page.title()));
  } else {
    page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log("playwright-chrome-open " + url + " title=" + (await page.title()));
  }
  if (!launched) process.exit(0);
  browser.on("disconnected", () => process.exit(0));
  await new Promise(() => {});
})().catch((e) => {
  console.error("playwright-failed", e);
  process.exit(1);
});
