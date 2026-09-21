const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = "D:\\GROK\\Life Whatever\\Projects\\Sunday Bakery\\docs";
const OUT_JSON = path.join(OUT_DIR, "sunday-markets-boksburg-benoni-research.json");
const OUT_MD = path.join(OUT_DIR, "SUNDAY-MARKETS-BOKSBURG-BENONI.md");
const SCREEN_DIR = path.join(OUT_DIR, "research-screens");

const QUERIES = [
  "Sunday market Boksburg",
  "Sunday market Benoni",
  "Sunday flea market East Rand",
  "flea market every Sunday Boksburg Benoni",
  "farmers market Sunday Boksburg",
  "crafts market Sunday Benoni",
];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function safeText(el) {
  try {
    return ((await el.innerText()) || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

async function collectFromPage(page, sourceLabel) {
  const items = [];
  // Generic link harvest focused on market-ish text
  const links = await page.$$("a[href]");
  for (const a of links) {
    let href = "";
    let text = "";
    try {
      href = (await a.getAttribute("href")) || "";
      text = await safeText(a);
    } catch {
      continue;
    }
    if (!href) continue;
    const full = href.startsWith("http") ? href : href.startsWith("/") ? new URL(href, page.url()).href : "";
    if (!full) continue;
    const blob = (text + " " + full).toLowerCase();
    const looksRelevant =
      /market|flea|farmers?|craft|bazaar|sunday|boksburg|benoni|east\s*rand|kempton|brakpan|springs|germiston|edenvale/i.test(
        blob
      );
    if (!looksRelevant) continue;
    // Prefer facebook destinations or title-like market names
    if (!/facebook\.com|market|flea|sunday|boksburg|benoni/i.test(blob)) continue;
    items.push({
      source: sourceLabel,
      text: text.slice(0, 240),
      href: full.split("?")[0],
      pageUrl: page.url(),
    });
  }
  return items;
}

async function duckDuckGoSearch(page, query) {
  const url =
    "https://duckduckgo.com/?q=" +
    encodeURIComponent(query + " site:facebook.com") +
    "&ia=web";
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  // Expand organic results
  const results = [];
  const resultEls = await page.$$('[data-testid="result"], article, .result, li[data-layout="organic"]');
  if (resultEls.length === 0) {
    // fallback: any a tags with facebook
    const as = await page.$$("a[href*='facebook.com']");
    for (const a of as) {
      const href = (await a.getAttribute("href")) || "";
      const text = await safeText(a);
      if (/facebook\.com\/(pages|groups|events|profile|people|marketplace)?/i.test(href) || /facebook\.com\//i.test(href)) {
        results.push({ source: "ddg:" + query, text: text.slice(0, 240), href: href.split("&")[0], pageUrl: page.url() });
      }
    }
  } else {
    for (const el of resultEls) {
      try {
        const a = await el.$("a[href]");
        if (!a) continue;
        let href = (await a.getAttribute("href")) || "";
        const text = await safeText(el);
        if (!/facebook\.com/i.test(href) && !/facebook\.com/i.test(text)) continue;
        // unwrap ddg redirect
        const m = href.match(/uddg=([^&]+)/);
        if (m) {
          try {
            href = decodeURIComponent(m[1]);
          } catch {}
        }
        results.push({
          source: "ddg:" + query,
          text: text.slice(0, 300),
          href: href.split("?")[0],
          pageUrl: page.url(),
        });
      } catch {}
    }
  }
  const harvested = await collectFromPage(page, "ddg-harvest:" + query);
  return results.concat(harvested);
}

async function openFacebookSearch(page, query) {
  const url =
    "https://www.facebook.com/search/top/?q=" + encodeURIComponent(query);
  const notes = [];
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3500);
    const title = await page.title();
    notes.push("title=" + title);
    const body = ((await page.locator("body").innerText().catch(() => "")) || "").slice(0, 4000);
    if (/log in|log into facebook|create new account|you must log in/i.test(body)) {
      notes.push("login_wall=true");
    }
    // Try pages tab
    const items = await collectFromPage(page, "fb-search:" + query);
    // Also grab visible text snippets mentioning market
    const snippets = [];
    const lines = body.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/market|flea|sunday|boksburg|benoni/i.test(line) && line.length > 8 && line.length < 220) {
        snippets.push(line);
      }
    }
    return { items, notes, snippets: uniqBy(snippets.map((s) => ({ s })), (x) => x.s).map((x) => x.s).slice(0, 40), bodyPreview: body.slice(0, 1500) };
  } catch (e) {
    notes.push("error=" + String(e.message || e));
    return { items: [], notes, snippets: [], bodyPreview: "" };
  }
}

async function googleViaBing(page, query) {
  // Bing often surfaces public FB pages without FB login
  const url = "https://www.bing.com/search?q=" + encodeURIComponent(query + " site:facebook.com Boksburg OR Benoni OR \"East Rand\" Sunday market");
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2000);
  const results = [];
  const as = await page.$$("li.b_algo h2 a, #b_results h2 a, a[href*='facebook.com']");
  for (const a of as) {
    try {
      const href = (await a.getAttribute("href")) || "";
      const text = await safeText(a);
      if (!/facebook\.com/i.test(href)) continue;
      results.push({ source: "bing:" + query, text: text.slice(0, 240), href: href.split("?")[0], pageUrl: page.url() });
    } catch {}
  }
  const harvested = await collectFromPage(page, "bing-harvest:" + query);
  return results.concat(harvested);
}

(async () => {
  ensureDir(OUT_DIR);
  ensureDir(SCREEN_DIR);
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    viewport: null,
    locale: "en-ZA",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const allItems = [];
  const fbSessions = [];
  const screenshots = [];

  // 1) Facebook direct searches
  for (const q of [
    "Sunday market Boksburg",
    "Sunday market Benoni",
    "flea market Sunday East Rand",
    "Sunday market Kempton Park",
  ]) {
    console.log("FB search:", q);
    const res = await openFacebookSearch(page, q);
    fbSessions.push({ query: q, notes: res.notes, snippets: res.snippets, bodyPreview: res.bodyPreview });
    allItems.push(...res.items);
    const shot = path.join(SCREEN_DIR, "fb-" + q.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png");
    try {
      await page.screenshot({ path: shot, fullPage: false });
      screenshots.push(shot);
      console.log("shot", shot);
    } catch (e) {
      console.log("shot fail", e.message);
    }
  }

  // 2) Bing + DDG for public Facebook pages (no login)
  for (const q of QUERIES) {
    console.log("Bing:", q);
    try {
      const r = await googleViaBing(page, q);
      allItems.push(...r);
    } catch (e) {
      console.log("bing fail", e.message);
    }
    console.log("DDG:", q);
    try {
      const r = await duckDuckGoSearch(page, q);
      allItems.push(...r);
    } catch (e) {
      console.log("ddg fail", e.message);
    }
  }

  // 3) Visit promising Facebook page URLs and extract about text
  let candidates = uniqBy(
    allItems.filter((x) => /facebook\.com/i.test(x.href || "")),
    (x) => (x.href || "").replace(/\/$/, "").toLowerCase()
  );

  // Prioritize pages/groups with market-ish names
  candidates = candidates
    .filter((c) => !/facebook\.com\/(login|recover|help|privacy|policies|watch|reel|share)/i.test(c.href))
    .slice(0, 25);

  const pageDetails = [];
  for (const c of candidates.slice(0, 12)) {
    console.log("Visit", c.href);
    try {
      await page.goto(c.href, { waitUntil: "domcontentloaded", timeout: 40000 });
      await page.waitForTimeout(2500);
      const title = await page.title();
      const body = ((await page.locator("body").innerText().catch(() => "")) || "").slice(0, 5000);
      const sunday = /sunday/i.test(body + " " + title + " " + c.text);
      const area = /boksburg|benoni|kempton|east\s*rand|brakpan|springs|germiston|edenvale|alberton/i.test(
        body + " " + title + " " + c.text
      );
      const everySunday = /every\s+sunday|sundays?(\s+from)?|open\s+every\s+sunday|sunday\s+(market|flea|farmers)/i.test(
        body + " " + c.text
      );
      pageDetails.push({
        href: c.href,
        linkText: c.text,
        title,
        sunday,
        area,
        everySunday,
        excerpt: body
          .split(/\n+/)
          .map((l) => l.trim())
          .filter((l) => /sunday|market|boksburg|benoni|kempton|east rand|open|flea|hours|am|pm/i.test(l))
          .slice(0, 20),
        loginWall: /log in|log into facebook|you must log in/i.test(body),
      });
      const shot = path.join(
        SCREEN_DIR,
        "page-" +
          c.href
            .replace(/https?:\/\//, "")
            .replace(/[^a-z0-9]+/gi, "-")
            .slice(0, 60) +
          ".png"
      );
      try {
        await page.screenshot({ path: shot, fullPage: false });
        screenshots.push(shot);
      } catch {}
    } catch (e) {
      pageDetails.push({ href: c.href, error: String(e.message || e) });
    }
  }

  // Known-name targeted searches (from regional knowledge + query expansion)
  const knownNames = [
    "Parkrand Market",
    "Benoni Market",
    "Boksburg Market",
    "East Rand Market Sunday",
    "Kempton Park Market Sunday",
    "Carnival City market",
    "Northmead market Benoni",
    "Rynfield market",
    "Sunward Park market",
  ];
  for (const name of knownNames) {
    try {
      const r = await googleViaBing(page, name + " Sunday Facebook");
      allItems.push(...r);
    } catch {}
  }

  candidates = uniqBy(
    allItems.filter((x) => /facebook\.com/i.test(x.href || "")),
    (x) => (x.href || "").replace(/\/$/, "").toLowerCase()
  ).filter((c) => !/facebook\.com\/(login|recover|help|privacy|policies)/i.test(c.href));

  const payload = {
    researchedAt: new Date().toISOString(),
    area: "Boksburg / Benoni (East Rand)",
    method: "Playwright Chrome — Facebook search + Bing/DDG site:facebook.com + page visits",
    fbSessions,
    linkCount: candidates.length,
    candidates: candidates.slice(0, 80),
    pageDetails,
    screenshots,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  // Build markdown report
  const strong = pageDetails.filter((p) => p.everySunday || (p.sunday && p.area));
  const maybe = pageDetails.filter((p) => !strong.includes(p) && (p.sunday || p.area));

  let md = "";
  md += "# Sunday markets near Boksburg / Benoni\n\n";
  md += `**Researched:** ${payload.researchedAt}  \n`;
  md += `**Method:** Playwright (Google Chrome) — Facebook search pages + Bing/DuckDuckGo for public Facebook results + follow-up page visits.  \n`;
  md += `**Focus:** Markets open **every Sunday**, around **Boksburg / Benoni** (East Rand).\n\n`;
  md += "> Facebook often shows a **login wall** for full search. Findings combine direct FB visits with public search results that link to Facebook pages.\n\n";
  md += "## Stronger candidates (Sunday + area signals)\n\n";
  if (strong.length === 0) {
    md += "_No page visit produced a clear every-Sunday + East Rand confirmation from visible public text. See candidate links below for manual check while logged in._\n\n";
  } else {
    for (const p of strong) {
      md += `### ${p.title || p.linkText || p.href}\n`;
      md += `- **URL:** ${p.href}\n`;
      md += `- **Sunday signal:** ${p.sunday} · **Every Sunday:** ${p.everySunday} · **Area signal:** ${p.area}\n`;
      if (p.excerpt && p.excerpt.length) md += `- **Snippets:**\n` + p.excerpt.map((e) => `  - ${e}`).join("\n") + "\n";
      md += "\n";
    }
  }
  md += "## Other visited pages\n\n";
  for (const p of maybe.slice(0, 15)) {
    md += `- [${p.title || p.linkText || "page"}](${p.href}) — sunday=${!!p.sunday} area=${!!p.area} loginWall=${!!p.loginWall}\n`;
    if (p.excerpt && p.excerpt[0]) md += `  - ${p.excerpt[0]}\n`;
  }
  md += "\n## Facebook / search link harvest (deduped)\n\n";
  for (const c of candidates.slice(0, 40)) {
    md += `- [${(c.text || c.href).slice(0, 100)}](${c.href}) _(${c.source})_\n`;
  }
  md += "\n## Facebook session notes\n\n";
  for (const s of fbSessions) {
    md += `### Query: ${s.query}\n`;
    md += `- Notes: ${(s.notes || []).join("; ")}\n`;
    if (s.snippets && s.snippets.length) {
      md += `- Visible snippets:\n`;
      for (const sn of s.snippets.slice(0, 12)) md += `  - ${sn}\n`;
    }
    md += "\n";
  }
  md += "## Screenshots\n\n";
  for (const s of screenshots) md += `- \`${s}\`\n`;
  md += "\n## Next manual steps (logged-in FB)\n\n";
  md += "1. Open Facebook → search each query above while logged in.\n";
  md += "2. Filter **Pages** and **Events** for recurring Sunday markets.\n";
  md += "3. Confirm **hours**, **address**, **vendor application**, and that it runs **every** Sunday (not monthly).\n";
  md += "4. Cross-check WhatsApp/community groups for East Rand pop-up markets.\n";

  fs.writeFileSync(OUT_MD, md, "utf8");
  console.log("WROTE", OUT_MD);
  console.log("WROTE", OUT_JSON);
  console.log("candidates", candidates.length, "details", pageDetails.length, "strong", strong.length);

  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
