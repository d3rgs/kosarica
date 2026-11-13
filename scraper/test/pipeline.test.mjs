import test from "node:test"; import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { FOODS } from "../config/foods.mjs";
import { collect, finalize } from "../lib/pipeline.mjs";
import spar from "../stores/spar.mjs"; import mercator from "../stores/mercator.mjs"; import hofer from "../stores/hofer.mjs";

const fx = (f) => fs.readFileSync(new URL("./fixtures/" + f, import.meta.url), "utf8");
// Hoferjeve izdelke iz posnetka zapakiramo v obliko __NUXT_DATA__ (devalue), kot jo vrne pravi strežnik.
function nuxtHtml(products) {
  const arr = [];
  const add = (v) => {
    if (v && typeof v === "object") { const i = arr.length; arr.push(null); arr[i] = Array.isArray(v) ? v.map(add2) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, add2(x)])); return i; }
    arr.push(v); return arr.length - 1;
  };
  const add2 = (v) => (v === null || typeof v === "boolean" ? v : add(v));
  products.forEach(add);
  return `<html><script type="application/json" id="__NUXT_DATA__">${JSON.stringify(arr)}</script></html>`;
}
const NOW = "2026-11-11T05:00:00Z";
function makeScan(failHost) {
  const { extractSpar, extractMercator } = globalThis.__dom;
  return async (url) => {
    if (failHost && url.includes(failHost)) throw new Error("HTTP 403");
    if (url.includes("online.spar.si")) return { dom: extractSpar(new JSDOM(fx("spar.html")).window.document) };
    if (url.includes("mercatoronline.si")) return { dom: extractMercator(new JSDOM(fx("mercator.html")).window.document) };
    return { html: nuxtHtml(JSON.parse(fx("hofer-products.json"))) };
  };
}
test.before(async () => { globalThis.__dom = await import("../lib/dom.mjs"); });

test("probe → run: stran se pretvori v veljavne zapise izdelkov", async () => {
  const { fresh, status } = await collect({ stores: [hofer, mercator, spar], scan: makeScan(), foods: FOODS, now: NOW });
  assert.ok(status.SPAR.ok && status.Mercator.ok && status.Hofer.ok, JSON.stringify(status));
  const m = finalize({ offers: [] }, fresh, NOW);
  assert.ok(m.offers.length >= 6);
  for (const o of m.offers) {
    assert.ok(o.price > 0 && o.amount > 0 && ["g", "kg", "ml", "l", "kos", "m", "cm"].includes(o.unit), JSON.stringify(o));
    assert.ok(o.store && o.food && o.name && o.url && o.checkedAt === NOW);
  }
  assert.ok(m.offers.some((o) => o.store === "Hofer" && o.food === "Goveje mleto meso" && o.price === 4.99));
  assert.ok(!m.offers.some((o) => /bananic|FRUTABELA|SIRUP/i.test(o.name)));
  assert.ok(m.offers.filter((o) => o.store === "SPAR" && o.food === "Jajca").length <= 5);
});
test("neuspešna trgovina ne izbriše prejšnjih veljavnih podatkov, napačni stari zapisi izpadejo", async () => {
  const ok = await collect({ stores: [spar], scan: makeScan(), foods: FOODS, now: "2026-11-10T05:00:00Z" });
  const prev = finalize({ offers: [{ store: "SPAR", food: "Banane", name: "SKUTA BANANA, FRUCHTZWERGE, 300G", amount: 300, unit: "g", price: 2.29, checkedAt: "2026-11-10T05:00:00Z" }] }, ok.fresh, "2026-11-10T05:00:00Z");
  assert.ok(!prev.offers.some((o) => /SKUTA BANANA/.test(o.name)));             // napačno ujemanje izpade
  const n = prev.offers.length; assert.ok(n > 0);
  const bad = await collect({ stores: [spar], scan: makeScan("online.spar.si"), foods: FOODS, now: NOW });
  assert.equal(bad.status.SPAR.ok, false); assert.match(bad.status.SPAR.error, /403/); assert.equal(bad.fresh.length, 0);
  const after = finalize({ offers: prev.offers }, bad.fresh, NOW);
  assert.equal(after.offers.length, n);                                         // nič ni izgubljeno
  assert.ok(after.offers.every((o) => o.checkedAt === "2026-11-10T05:00:00Z"));  // zastarelost ostane vidna
});
