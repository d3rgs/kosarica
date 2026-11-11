import test from "node:test"; import assert from "node:assert/strict";
import { matchFood, toOffers } from "../lib/match.mjs";
test("ujemanje živil", () => {
  assert.equal(matchFood({ name: "Sveže goveje mleto meso OKUS PODEŽELJA", packText: "500 g" }).food, "Goveje mleto meso");
  assert.equal(matchFood({ name: "Trajno mleko brez zamaška, 1,5%", packText: "1 l" }).food, "Mleko 1,5 %");
  assert.equal(matchFood({ name: "Mleko 3,5 % 1 l" }).food, null);
  assert.equal(matchFood({ name: "Čokoladno mleko 1,5 % 1 l" }).food, null);
  assert.equal(matchFood({ name: "Banane 1 kg" }).food, "Banane");
  assert.equal(matchFood({ name: "Banane čips 100 g" }).food, null);
  assert.equal(matchFood({ name: "Jajca M 10 kos" }).food, "Jajca");
});
test("pakiranje in EAN", () => {
  assert.equal(matchFood({ name: "Mleko 1,5 %", packText: "500 g" }).confidence, "low");
  assert.equal(matchFood({ name: "Karkoli", ean: "123" }, { 123: "Kaki" }).confidence, "high");
});
test("ponudbe", () => {
  const o = toOffers("Hofer", "https://x.si/a", [{ name: "Banane 1 kg", price: 1.49, url: "/izdelek/1" }, { name: "Nekaj drugega", price: 1 }], {}, "2026-11-10T05:00:00Z");
  assert.equal(o.length, 1); assert.equal(o[0].url, "https://x.si/izdelek/1"); assert.equal(o[0].unit, "kg"); assert.equal(o[0].kind, "redna");
});
