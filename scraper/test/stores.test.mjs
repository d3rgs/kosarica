import test from "node:test"; import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { extractSpar, extractMercator, extractLidl } from "../lib/dom.mjs";
import { sparCands, mercatorCands, lidlCands, hoferToCand } from "../lib/cands.mjs";
import { toOffers } from "../lib/match.mjs";
import { hoferProducts } from "../lib/nuxt.mjs";
// Posnetki so izrezani iz resničnih strani (probe 11. 11. 2026).
const doc = (f) => new JSDOM(fs.readFileSync(new URL("./fixtures/" + f, import.meta.url), "utf8")).window.document;
const NOW = "2026-11-11T05:00:00Z";
const offers = (store, cands) => { const st = {}; return { o: toOffers(store, "https://x.si/", cands, {}, NOW, st), st }; };
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.006, `${a} ≠ ${b}`);

test("SPAR: banane, cene in primerjalne cene iz strani", () => {
  const { o, st } = offers("SPAR", sparCands(extractSpar(doc("spar.html"))));
  const b = o.filter((x) => x.food === "Banane");
  assert.equal(b.length, 2, JSON.stringify(st));                       // sestavljeni izdelki (sirup, Frutabela) izpadejo
  assert.equal(b[0].price, 0.75); assert.equal(b[0].amount, 500); assert.equal(b[0].unit, "g"); near(b[0].unitPrice, 1.49);
  assert.equal(b[1].price, 0.95); near(b[1].unitPrice, 1.89);
});
test("SPAR: jajca (10/1) in akcijska cena s prejšnjo ceno", () => {
  const { o } = offers("SPAR", sparCands(extractSpar(doc("spar.html"))));
  const e = o.filter((x) => x.food === "Jajca");
  assert.ok(e.some((x) => x.amount === 10 && x.unit === "kos" && x.price === 4.49));
  const promo = e.find((x) => /TALNA REJA/.test(x.name)); assert.equal(promo.kind, "akcija"); assert.equal(promo.regularPrice, 3.69); assert.equal(promo.promoPrice, 2.95);
  assert.ok(!o.some((x) => /HLADILNIK/.test(x.name)));                 // osvežilec za hladilnik ni jajce
});
test("Mercator: Banane brez količine v imenu dobijo 1 kg iz primerjalne cene", () => {
  const { o } = offers("Mercator", mercatorCands(extractMercator(doc("mercator.html"))));
  const b = o.find((x) => x.food === "Banane"); assert.ok(b); assert.equal(b.price, 1.49); assert.equal(b.amount, 1); assert.equal(b.unit, "kg");
  assert.ok(!o.some((x) => /bananice/i.test(x.name)));                 // čokoladne bananice niso banane
  assert.ok(o.some((x) => x.food === "Jajca" && x.amount === 10));
});
test("Lidl: akcije z veljavnostjo, kaki na kos ni primerljiv s kg", () => {
  const c = lidlCands(extractLidl(doc("lidl.html")), new Date(NOW));
  const z = c.find((x) => x.name === "Rdeče zelje"); assert.equal(z.price, 0.89); assert.equal(z.regularPrice, 1.29); assert.equal(z.validFrom, "2026-11-05"); assert.equal(z.validTo, "2026-11-11");
  assert.ok(c.find((x) => x.name === "Cvetača").loyalty);
  const { o, st } = offers("Lidl", c);
  assert.ok(!o.some((x) => x.food === "Kaki")); assert.ok(st.rejected.some((r) => /Kaki/.test(r)));
});
test("Hofer: cene v centih, količina in primerjalna cena", () => {
  const ps = JSON.parse(fs.readFileSync(new URL("./fixtures/hofer-products.json", import.meta.url), "utf8"));
  const { o, st } = offers("Hofer", ps.map(hoferToCand));
  const m = o.find((x) => x.food === "Goveje mleto meso"); assert.equal(m.price, 4.99); assert.equal(m.amount, 500); near(m.unitPrice, 9.98);
  assert.ok(o.some((x) => x.food === "Ovseni kosmiči" && x.price === 2.09));
  assert.ok(!o.some((x) => x.food === "Mleko 1,5 %"));                 // API nima količine: ne ugibamo
  assert.ok(st.rejected.some((r) => /mleko/i.test(r)));
});
test("Nuxt payload", () => {
  const arr = [{ a: 1 }, { sku: 2, name: 3, sellingSize: 4, price: 5 }, "123", "Mleko", "1 l", { amount: 6 }, 99];
  arr[0] = { x: 1 };
  const html = `<script type="application/json" id="__NUXT_DATA__">${JSON.stringify(arr)}</script>`;
  const p = hoferProducts(html); assert.equal(p.length, 1); assert.equal(p[0].name, "Mleko"); assert.equal(p[0].price.amount, 99);
});
