import test from "node:test"; import assert from "node:assert/strict";
import { fromJson, fromJsonLd, fromRsc, fromText, harvestAll } from "../lib/harvest.mjs";
test("JSON", () => {
  const r = fromJson({ data: { products: [{ name: "Alpsko mleko 1,5 % 1 l", brand: { name: "Alpsko" }, price: { value: 1.29 }, regularPrice: 1.49, ean: "3830001234567", sku: "398681" }] } });
  assert.equal(r.length, 1); assert.equal(r[0].price, 1.29); assert.equal(r[0].regularPrice, 1.49); assert.equal(r[0].ean, "3830001234567"); assert.equal(r[0].brand, "Alpsko");
});
test("JSON-LD", () => {
  const html = '<script type="application/ld+json">{"@type":"Product","name":"Banane 1 kg","sku":"1","offers":{"price":"1.49"}}</script>';
  assert.equal(fromJsonLd(html)[0].price, 1.49);
});
test("RSC", () => {
  const t = '0:["$","div",null,{}]\n1:{"items":[{"title":"Jajca M 10 kos","price":2.99}]}\n';
  assert.equal(fromRsc(t)[0].name, "Jajca M 10 kos");
});
test("besedilo (hevristika, fixture je ocena oblike)", () => {
  const t = "Sveže goveje mleto meso\nOKUS PODEŽELJA\n500 g (9,98 €/1 kg)\n4,99 €\nTrajno mleko 1,5%\n1 l\n0,79 €\n";
  const r = fromText(t);
  assert.equal(r.length, 2); assert.equal(r[0].price, 4.99); assert.match(r[0].name, /mleto meso/); assert.equal(r[0].packText, "500 g");
  assert.equal(r[1].price, 0.79);
});
test("besedilo: vrstice vmesnika in imena s količino se ne zamenjajo s pakiranjem", () => {
  const t = 'Rezultati za "banane"\nRazvrsti po:\nDodaj BIO BANANE, TEHTANO, ENOTA 500G\n0,95 €\nNi na voljo MLETO MESO MEŠANO, OBLAK, 1KG\n9,99 €\n';
  const r = fromText(t);
  assert.equal(r.length, 2); assert.equal(r[0].name, "BIO BANANE, TEHTANO, ENOTA 500G"); assert.equal(r[0].price, 0.95); assert.equal(r[1].name, "MLETO MESO MEŠANO, OBLAK, 1KG");
});
test("podvojeni zapisi", () => {
  assert.equal(harvestAll({ jsons: [{ a: [{ name: "Test izdelek", price: 1 }, { name: "Test izdelek", price: 1 }] }] }).length, 1);
});
