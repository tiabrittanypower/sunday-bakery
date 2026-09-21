const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = "D:\\GROK\\Life Whatever\\Projects\\Sunday Bakery\\docs";
const urls = [
  "https://www.facebook.com/ERTSquare/",
  "https://www.facebook.com/benonimarket/",
  "https://www.facebook.com/junction21/",
  "https://www.facebook.com/100057119244216/",
  "https://www.facebook.com/BOKBUN13/",
  "https://www.facebook.com/bokkieparkcraftmarket/",
  "https://www.facebook.com/HappySoulsMarket/",
  "https://www.facebook.com/craftsinthepark2/",
  "https://www.facebook.com/people/Ebotse-Market-in-the-park/100068727156486/",
  "https://www.facebook.com/East-Rand-Mall-Flea-Market-109848042488582/",
  "https://www.facebook.com/East-Rand-Outdoor-Flea-Market-272086179916864/",
  "https://www.facebook.com/realthrivers/",
  "https://www.facebook.com/RosebankSundayMarket/",
];

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage({ viewport: null, locale: "en-ZA" });
  const details = [];

  for (const url of urls) {
    console.log("VISIT", url);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
      await page.waitForTimeout(3000);
      try {
        await page.getByRole("button", { name: /allow|accept|ok/i }).first().click({ timeout: 1500 });
      } catch {
        /* ignore */
      }
      const title = await page.title();
      const body = (await page.locator("body").innerText().catch(() => "")) || "";
      const lines = body
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);
      const interesting = lines
        .filter(
          (l) =>
            /sunday|saturday|monday|tuesday|wednesday|thursday|friday|hours|open|market|flea|boksburg|benoni|kempton|am|pm|every|weekly|monthly|stall|vendor|address|road|park|mall/i.test(
              l
            ) && l.length < 280
        )
        .slice(0, 25);
      const flags = {
        everySunday:
          /every\s+sunday|sundays?\s*(from|:)|open\s+every\s+sunday|tue(sday)?\s*(to|–|-|—)\s*sun|tuesday to sunday|tuesdays? to sundays?/i.test(
            body
          ),
        sunday: /\bsunday\b/i.test(body + title),
        saturday: /\bsaturday\b/i.test(body + title),
        boksburg: /boksburg/i.test(body + title),
        benoni: /benoni/i.test(body + title),
        monthly: /monthly/i.test(body + title),
      };
      details.push({
        url,
        title,
        flags,
        interesting,
        loginWall: /log in|log into facebook/i.test(body),
        bodyLen: body.length,
      });
      const shot = path.join(
        OUT,
        "research-screens",
        "pass2-" +
          url
            .replace(/^https?:\/\//, "")
            .replace(/[^a-z0-9]+/gi, "-")
            .slice(0, 50) +
          ".png"
      );
      try {
        await page.screenshot({ path: shot, fullPage: false });
      } catch {
        /* ignore */
      }
      console.log(JSON.stringify({ url, title, flags, top: interesting.slice(0, 10) }));
    } catch (e) {
      details.push({ url, error: String(e.message || e) });
      console.log("ERR", url, e.message);
    }
  }

  fs.writeFileSync(
    path.join(OUT, "sunday-markets-pass2.json"),
    JSON.stringify({ at: new Date().toISOString(), details }, null, 2),
    "utf8"
  );
  console.log("DONE pass2", details.length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
