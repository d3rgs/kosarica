import test from "node:test"; import assert from "node:assert/strict";
import { parsePack, parsePrice, unitPrice, family } from "../lib/normalize.mjs";
test("pakiranja", () => {
  assert.deepEqual(parsePack("500 g"), { amount: 500, unit: "g" });
  assert.deepEqual(parsePack("1,5 L"), { amount: 1.5, unit: "l" });
  assert.deepEqual(parsePack("6 x 1 l"), { amount: 6, unit: "l" });
  assert.deepEqual(parsePack("33 cl"), { amount: 330, unit: "ml" });
  assert.deepEqual(parsePack("Jajca M 10 jajc"), { amount: 10, unit: "kos" });
  assert.deepEqual(parsePack("Mleko 1,5 % 1 l"), { amount: 1, unit: "l" });
  assert.equal(parsePack("banane"), null);
});
test("cene in enote", () => {
  assert.equal(parsePrice("4,99 €"), 4.99);
  assert.equal(parsePrice("cena 1.29 EUR"), 1.29);
  assert.ok(Math.abs(unitPrice(1.3, 100, "g") - 13) < 1e-9);
  assert.ok(Math.abs(unitPrice(3, 400, "g") - 7.5) < 1e-9);
  assert.equal(family("ml"), "l");
});
