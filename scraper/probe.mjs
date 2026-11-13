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
      const s = await scanPage(browser, url, mod.scan || {}), c = mod.cands ? mod.cands(s) : harvestAll(s), st = {}, o = toOffers(name, url, c, {}, new Date().toISOString(), st);
      const id = `${name}-${i}`;
      fs.writeFileSync(`debug/${id}.png`, s.shot); fs.writeFileSync(`debug/${id}.html`, s.html);
      Object.assign(r, { status: s.status, jsonResponses: s.jsons.length, rscResponses: s.rscs.length, jsonLd: fromJsonLd(s.html).length,
        rawItems: Array.isArray(s.dom) ? s.dom.length : undefined, candidates: c.length, matched: o.length, rejected: st.rejected, unmatched: st.unmatched, sample: o.slice(0, 3).map((x) => `${x.food}: ${x.name} ${x.amount} ${x.unit} ${x.price} €`), textHead: s.text.slice(0, 600), responses: s.meta.filter((m) => !/cookie|onetrust|consent|monitoring|featureassets|registry|translation|messages|builds\/meta/i.test(m.url)) });
    } catch (e) { r.error = String(e.message || e).slice(0, 200); }
    report.push(r); console.log(JSON.stringify(r));
  }
}
await browser.close();
fs.writeFileSync("debug/probe-report.json", JSON.stringify(report, null, 1));
