import test from "node:test"; import assert from "node:assert/strict";
import { matchFood, toOffers, stillValid } from "../lib/match.mjs";
const F = (name, packText) => matchFood({ name, packText }).food;
test("pravilna ujemanja (resnična imena iz SPAR in Hofer)", () => {
  assert.equal(F("Sveže goveje mleto meso OKUS PODEŽELJA", "500 g"), "Goveje mleto meso");
  assert.equal(F("Trajno mleko brez zamaška, 1,5%", "1 l"), "Mleko 1,5 %");
  assert.equal(F("ODLIČNA KAKOVOST SVEŽE MLEKO 1,5% M.M., SPAR, 1L"), "Mleko 1,5 %");
  assert.equal(F("MLETO GOVEJE MESO, S-BUDGET, 500G"), "Goveje mleto meso");
  assert.equal(F("PURANJE MLETO MESO, VINDIJA, 400G"), "Drugo mleto meso");
  assert.equal(F("BIO BANANE, SPAR NATUR*PUR, TEHTANO, ENOTA 500G"), "Banane");
  assert.equal(F("DOLGE KUMARE, TEHTANO, ENOTA 500G"), "Kumare");
  assert.equal(F("ODLIČNA KAKOVOST TUNINA V LASTNEM SOKU, DESPAR, 3X80G"), "Tuna v lastnem soku (odcejena masa)");
  assert.equal(F("PROTEINSKA TORTILJA, MEXICANA, 370G"), "Proteinske tortilije");
});
test("napačna ujemanja so zavrnjena (iz prvega zagona)", () => {
  for (const n of ["SWEET VALLEY Vitaminska kaša, jabolko-banana-malina", "GOLDEN BRIDGE Premium muesli, jagoda-banana", "MILSANI Sadni skyr, malina",
    "FRUTOLINO, JABOLKO, BANANA IN KEKS, LINO, 190G", "KAŠICA JABOLKO IN BANANA LINO, PODRAVKA, 190G", "MINI BUČKE POLNJENE S SIROM, KÄSEMACHER, 250G",
    "POSUŠEN ČIPS IZ BUČK, TRUE STORY, 20G", "PIŠČANČJI CURRY PERFECT, PERUTNINA PTUJ, 350G", "OCVIRKI S KAJENSKIM POPROM, PANVITA, 100G",
    "KEKSI REMIX MALINA, OREO, 157G", "BIO KOSMIČI Z OKUSOM MALINE, GRACI, 300G", "OVSENA KAŠA MALINA, BOOM BOX, 300G",
    "DELIKATESNE KUMARICE, SPAR, 670G", "KAMNIŠKE KUMARICE, NATURETA, 1KG", "Mleko 3,5 % 1 l", "Čokoladno mleko 1,5 % 1 l", "Banane čips 100 g"])
    assert.equal(F(n, ""), null, n);
});
test("pakiranje in EAN", () => {
  assert.equal(matchFood({ name: "Mleko 1,5 %", packText: "500 g" }).confidence, "low");
  assert.equal(matchFood({ name: "Karkoli", ean: "123" }, { 123: "Kaki" }).confidence, "high");
});
test("ponudbe in ponovna preveritev", () => {
  const o = toOffers("Hofer", "https://x.si/a", [{ name: "Dodaj BANANE, TEHTANO, ENOTA 1KG", price: 1.49, url: "/izdelek/1" }, { name: "Nekaj drugega", price: 1 }], {}, "2026-11-10T05:00:00Z");
  assert.equal(o.length, 1); assert.equal(o[0].name, "BANANE, TEHTANO, ENOTA 1KG"); assert.equal(o[0].url, "https://x.si/izdelek/1"); assert.equal(o[0].unit, "kg");
  assert.ok(stillValid(o[0]));
  assert.ok(!stillValid({ name: "SWEET VALLEY Vitaminska kaša, jabolko-banana-malina", food: "Banane", amount: 1, unit: "kg" }));
});
