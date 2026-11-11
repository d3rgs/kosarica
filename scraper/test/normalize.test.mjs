import test from "node:test"; import assert from "node:assert/strict";
import { parsePack, parsePrice, unitPrice, family, normalizeUnitPrice } from "../lib/normalize.mjs";
const eq = (t, amount, unit) => { const p = parsePack(t); assert.ok(p, t); assert.equal(p.amount, amount, t); assert.equal(p.unit, unit, t); };
test("pakiranja", () => {
  eq("500 g", 500, "g"); eq("1,5 L", 1.5, "l"); eq("6 x 1 l", 6, "l"); eq("6 × 0,5 l", 3, "l"); eq("3X80G", 240, "g");
  eq("33 cl", 330, "ml"); eq("Jajca M 10 jajc", 10, "kos"); eq("Mleko 1,5 % 1 l", 1, "l"); eq("folija 20 m", 20, "m"); eq("trak 50 cm", 50, "cm");
  assert.equal(parsePack("6 × 0,5 l").label, "6 × 0,5 l");
  assert.equal(parsePack("banane"), null);
  assert.equal(parsePack("Mleko 1,5 % m.m."), null);
});
test("cene in enote", () => {
  assert.equal(parsePrice("4,99 €"), 4.99);
  assert.equal(parsePrice("cena 1.29 EUR"), 1.29);
  assert.ok(Math.abs(unitPrice(1.3, 100, "g") - 13) < 1e-9);
  assert.ok(Math.abs(unitPrice(3, 400, "g") - 7.5) < 1e-9);
  assert.ok(Math.abs(unitPrice(3, 2000, "cm") - 0.15) < 1e-9);
  assert.equal(family("ml"), "l"); assert.equal(family("cm"), "m");
});
test("primeri iz zahteve: vse v €/kg, €/l, €/kos, €/m", () => {
  const r2 = (x) => +x.toFixed(2);
  let u = normalizeUnitPrice("0,89 €/100 g"); assert.equal(r2(u.value), 8.9); assert.equal(u.unit, "kg");
  u = normalizeUnitPrice("0,25 €/100 ml"); assert.equal(r2(u.value), 2.5); assert.equal(u.unit, "l");
  u = normalizeUnitPrice("1,49 € za 500 g"); assert.equal(r2(u.value), 2.98); assert.equal(u.unit, "kg");
  u = normalizeUnitPrice("1,79 € za 750 ml"); assert.equal(r2(u.value), 2.39); assert.equal(u.unit, "l");
  u = normalizeUnitPrice("2,99 €/1 kg"); assert.equal(r2(u.value), 2.99);
  assert.equal(normalizeUnitPrice("brez cene"), null);
  const p = parsePack("6 × 0,5 l"); assert.equal(r2(unitPrice(2.94, p.amount, p.unit)), 0.98);
});
