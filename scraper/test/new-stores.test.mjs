import test from "node:test"; import assert from "node:assert/strict";
import fs from "node:fs";
import { tusCands, eurospinCands } from "../lib/cands.mjs";
import { toOffers } from "../lib/match.mjs";
import { normalizeUnitPrice } from "../lib/normalize.mjs";
import { mergeRun } from "../lib/merge.mjs";
import { dropOutliers } from "../lib/pipeline.mjs";
import { offAccept, enrichImages } from "../lib/images.mjs";
const fx = (f) => fs.readFileSync(new URL("./fixtures/" + f, import.meta.url), "utf8");
const NOW = "2026-11-13T05:00:00Z";
test("Tuš: cena iz polja price (centi), kaša ni banana, mleko z redno ceno", () => {
  const st = {}, o = toOffers("Tuš", "https://www.tus.si/", tusCands(JSON.parse(fx("tus.json"))), {}, NOW, st);
  assert.equal(o.length, 1, JSON.stringify(st)); const m = o[0];
  assert.equal(m.food, "Mleko 1,5 %"); assert.equal(m.price, 0.99); assert.equal(m.regularPrice, 1.19); assert.equal(m.kind, "akcija"); assert.equal(m.amount, 1); assert.equal(m.unit, "l");
  assert.equal(m.img, "https://www.tus.si/wp-content/uploads/mleko.jpg");
});
test("Tuš: sale_price ob price = regular_price se ne uporabi kot cena", () => {
  const c = tusCands(JSON.parse(fx("tus.json")));
  const p = c.find((x) => /Fructal/.test(x.name)); assert.equal(p.price, 1.5); assert.equal(p.regularPrice, undefined);
});
test("Eurospin: akcije z veljavnostjo, količino in primerjalno ceno", () => {
  const c = eurospinCands(fx("eurospin.txt"), new Date(NOW));
  assert.equal(c.length, 4);                                            // blazina brez količine izpade
  const mleko = c.find((x) => /MLEKO/.test(x.name)); assert.equal(mleko.price, 0.69); assert.equal(mleko.regularPrice, 0.89); assert.equal(mleko.validFrom, "2026-11-12"); assert.equal(mleko.validTo, "2026-11-18");
  const st = {}, o = toOffers("Eurospin", "https://www.eurospin.si/akcije/", c, {}, NOW, st);
  assert.equal(o.length, 1, JSON.stringify(st)); assert.equal(o[0].food, "Mleko 1,5 %"); assert.equal(o[0].kind, "akcija"); assert.equal(o[0].amount, 1);
  const pulpa = c.find((x) => /PULPA/.test(x.name)); assert.equal(pulpa.packText, "2 x 230 g - za kg 2,16 €"); assert.ok(Math.abs(pulpa.unitPrice.value - 2.16) < 1e-9);
});
test("primerjalna cena »za kg 6,23 €«", () => { const u = normalizeUnitPrice("400 g - za kg 6,23 €"); assert.equal(u.unit, "kg"); assert.equal(u.value, 6.23); });
test("zgodovina cene: rekord in padec se smeta le iz opazovane zgodovine iste ponudbe", () => {
  const o = (p, t) => ({ store: "SPAR", sku: "1", name: "MLEKO", amount: 1, unit: "l", price: p, checkedAt: t });
  let r = mergeRun({ offers: [] }, [o(1.2, "2026-11-01T05:00:00Z")], "2026-11-01T05:00:00Z");
  assert.deepEqual(r.offers[0].h, [{ d: "2026-11-01", p: 1.2 }]); assert.equal(r.offers[0].fs, "2026-11-01");
  r = mergeRun({ offers: r.offers }, [o(1.2, "2026-11-05T05:00:00Z")], "2026-11-05T05:00:00Z"); assert.equal(r.offers[0].h.length, 1);   // brez spremembe ni novega zapisa
  r = mergeRun({ offers: r.offers }, [o(0.9, "2026-11-12T05:00:00Z")], "2026-11-12T05:00:00Z");
  assert.deepEqual(r.offers[0].h.map((x) => x.p), [1.2, 0.9]); assert.equal(r.offers[0].fs, "2026-11-01");
});
test("izstopajoče cene (npr. kaki 0,34 €/kg) se zavrnejo", () => {
  const mk = (p, n) => ({ store: "SPAR", food: "Kaki", name: n, amount: 1, unit: "kg", price: p });
  const { kept, dropped } = dropOutliers([mk(0.34, "A"), mk(1.5, "B"), mk(1.6, "C"), mk(1.9, "D"), mk(2.1, "E")]);
  assert.equal(kept.length, 4); assert.equal(dropped.length, 1); assert.match(dropped[0], /A/);
  assert.equal(dropOutliers([mk(0.34, "A"), mk(1.5, "B")]).kept.length, 2);   // z dvema ponudbama mediane ne računamo
});
const P = { code: "383", product_name: "Alpsko mleko 1,5 % m.m.", brands: "Ljubljanske mlekarne", quantity: "1 l", image_front_url: "https://images.openfoodfacts.org/x.jpg" };
const O = { name: "ALPSKO MLEKO 1,5% M.M.", brand: "Ljubljanske mlekarne", amount: 1, unit: "l" };
test("Open Food Facts: sprejme samo ujemanje količine, znamke in imena", () => {
  assert.ok(offAccept(O, P, true).ok);
  assert.equal(offAccept({ ...O, amount: 0.5 }, P, true).why, "količina se ne ujema");
  assert.equal(offAccept({ ...O, brand: "Pomurske mlekarne" }, P, true).why, "znamka se ne ujema");
  assert.equal(offAccept({ ...O, name: "Sir ementaler" }, P, false).why, "ime se ne ujema");
  assert.equal(offAccept(O, { ...P, image_front_url: "" }, true).why, "ni slike sprednje strani");
});
test("slike: slika trgovine ima prednost, EAN iskanje, predpomnjenje, dvoumno iskanje brez slike", async () => {
  const calls = []; const fetch = async (u) => { calls.push(u); return { ok: true, json: async () => (u.includes("/api/v2/product/") ? { status: 1, product: P } : { products: [P, { ...P, code: "999" }] }) }; };
  const offers = [{ ...O, img: "https://cdn.spar/x.jpg" }, { ...O, ean: "3830000000011" }, { ...O, name: "ALPSKO MLEKO 1,5% M.M. dvoumno" }];
  const cache = {}; const st = await enrichImages(offers, cache, { fetch, now: NOW });
  assert.equal(offers[0].imgSource, "trgovina"); assert.equal(offers[1].imgSource, "off"); assert.equal(offers[1].imgCode, "383");
  assert.equal(offers[2].img, undefined);                              // dve ujemanji: ne ugibamo
  const n = calls.length; await enrichImages([{ ...O, ean: "3830000000011" }], cache, { fetch, now: NOW }); assert.equal(calls.length, n); // iz predpomnilnika
  assert.equal(st.store, 1);
});
