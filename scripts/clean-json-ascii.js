const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const paths = [
  "data/config.json",
  "data/menus/week-1.json",
  "data/menus/week-2.json",
  "data/menus/week-3.json",
  "data/menus/week-4.json",
  "data/recipes/month-1.json",
].map((p) => path.join(ROOT, p));

function clean(s) {
  return String(s)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2248\u2245]/g, "~")
    .replace(/\u00b7/g, "|")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function walk(o) {
  if (typeof o === "string") return clean(o);
  if (Array.isArray(o)) return o.map(walk);
  if (o && typeof o === "object") {
    for (const k of Object.keys(o)) o[k] = walk(o[k]);
  }
  return o;
}

for (const p of paths) {
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  walk(d);
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n", "utf8");
  console.log("cleaned", path.basename(p));
}
