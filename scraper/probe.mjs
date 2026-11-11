// Preizkus: tri živila oziroma prve tri strani vsake trgovine. Zapiše poročilo, posnetke zaslona in HTML v debug/.
import { chromium } from "playwright";
import fs from "node:fs";
import { FOODS } from "./config/foods.mjs";
import { scanPage } from "./lib/page.mjs";
import { harvestAll, fromJsonLd } from "./lib/harvest.mjs";
import { toOffers } from "./lib/match.mjs";

fs.mkdirSync("debug", { recursive: true });
const test = FOODS.filter((f) => ["Mleko 1,5 %", "Jajca", "Banane"].includes(f.n));
const browser = await chromium.launch(), report = [];
for (const name of ["Hofer", "Mercator", "SPAR", "Lidl"]) {
  const mod = (await import(`./stores/${name.toLowerCase()}.mjs`)).default;
  for (const [i, url] of (await mod.pages(test)).slice(0, 4).entries()) {
    const r = { store: name, url };
    try {
      const s = await scanPage(browser, url), c = harvestAll(s), o = toOffers(name, url, c, {}, new Date().toISOString());
      const id = `${name}-${i}`;
      fs.writeFileSync(`debug/${id}.png`, s.shot); fs.writeFileSync(`debug/${id}.html`, s.html);
      Object.assign(r, { status: s.status, jsonResponses: s.jsons.length, rscResponses: s.rscs.length, jsonLd: fromJsonLd(s.html).length,
        candidates: c.length, matched: o.length, sample: o.slice(0, 3).map((x) => `${x.food}: ${x.name} ${x.amount} ${x.unit} ${x.price} €`), textHead: s.text.slice(0, 600), responses: s.meta });
    } catch (e) { r.error = String(e.message || e).slice(0, 200); }
    report.push(r); console.log(JSON.stringify(r));
  }
}
await browser.close();
fs.writeFileSync("debug/probe-report.json", JSON.stringify(report, null, 1));
