import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { FOODS } from "./config/foods.mjs";
import { scanPage } from "./lib/page.mjs";
import { harvestAll } from "./lib/harvest.mjs";
import { toOffers, stillValid } from "./lib/match.mjs";
import { cleanName } from "./lib/clean.mjs";
import { unitPrice } from "./lib/normalize.mjs";
import { mergeRun } from "./lib/merge.mjs";

const D = fileURLToPath(new URL("../data/", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(D + f, "utf8")); } catch { return d; } };

const now = new Date().toISOString(), eanMap = rd("ean-map.json", {}), prev = rd("prices.json", { offers: [] });
// že shranjene ponudbe preveri z današnjimi pravili: napačna ujemanja izpadejo, imena se počistijo
prev.offers = (prev.offers || []).map((o) => ({ ...o, name: cleanName(o.name) })).filter(stillValid);
const browser = await chromium.launch();
const stores = {}, fresh = [];
for (const name of ["Hofer", "Mercator", "SPAR", "Lidl"]) {
  const mod = (await import(`./stores/${name.toLowerCase()}.mjs`)).default;
  let n = 0, pages = 0, pagesOk = 0, cand = 0, err = null; const errors = [];
  for (const url of await mod.pages(FOODS)) {
    pages++;
    try {
      const c = harvestAll(await scanPage(browser, url)), o = toOffers(name, url, c, eanMap, now);
      fresh.push(...o); n += o.length; cand += c.length; pagesOk++;
    } catch (e) { err = String(e.message || e).slice(0, 160); if (errors.length < 3) errors.push(url.slice(0, 80) + ": " + err); console.log(`::warning::${name} ${url}: ${err}`); }
    await sleep(2500);
  }
  stores[name] = { ok: n > 0, offers: n, candidates: cand, pages, pagesOk, error: n > 0 ? null : err || "ni najdenih cen", errors, checkedAt: now };
}
await browser.close();
// največ 5 najcenejših ponudb na trgovino in živilo
const g = {};
for (const o of fresh) (g[o.store + "|" + o.food] ||= []).push(o);
const capped = Object.values(g).flatMap((a) => a.sort((x, y) => unitPrice(x.price, x.amount, x.unit) - unitPrice(y.price, y.amount, y.unit)).slice(0, 5));
const m = mergeRun(prev, capped, now);
fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(D + "prices.json", JSON.stringify({ generatedAt: now, stores, offers: m.offers }, null, 1));
if (m.hist.length) fs.appendFileSync(D + "history.jsonl", m.hist.map((h) => JSON.stringify(h)).join("\n") + "\n");
console.log(JSON.stringify({ stores, added: m.added, changed: m.changed }, null, 1));
