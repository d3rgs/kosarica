import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { FOODS } from "./config/foods.mjs";
import { scanPage } from "./lib/page.mjs";
import { collect, finalize, acceptManual } from "./lib/pipeline.mjs";
import { enrichImages } from "./lib/images.mjs";

const D = fileURLToPath(new URL("../data/", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(D + f, "utf8")); } catch { return d; } };

const now = new Date().toISOString(), eanMap = rd("ean-map.json", {}), prev = rd("prices.json", { offers: [] });
const stores = [];
for (const name of ["Hofer", "Mercator", "SPAR", "Lidl", "Tus", "Eurospin"]) stores.push((await import(`./stores/${name.toLowerCase()}.mjs`)).default);
const browser = await chromium.launch();
const { fresh, status } = await collect({ stores, scan: (url, opt) => scanPage(browser, url, opt), foods: FOODS, eanMap, now, pause: (ms) => sleep(ms ?? 2500), deadline: Date.now() + 20 * 60 * 1000 });
await browser.close();
const m = finalize(prev, [...fresh, ...acceptManual(rd("manual-offers.json", []), now)], now);
const cache = rd("images.json", {});
let imgStats = {};
try { imgStats = await enrichImages(m.offers, cache, { now, pause: (ms) => sleep(ms ?? 1200) }); fs.mkdirSync(D, { recursive: true }); fs.writeFileSync(D + "images.json", JSON.stringify(cache)); } catch (e) { console.log("::warning::slike: " + e.message); }
fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(D + "prices.json", JSON.stringify({ generatedAt: now, stores: status, images: imgStats, outliers: m.dropped, offers: m.offers }, null, 1));
if (m.hist.length) fs.appendFileSync(D + "history.jsonl", m.hist.map((h) => JSON.stringify(h)).join("\n") + "\n");
console.log(JSON.stringify({ stores: status, added: m.added, changed: m.changed, total: m.offers.length }, null, 1));
