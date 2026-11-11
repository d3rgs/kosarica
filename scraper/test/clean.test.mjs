import test from "node:test"; import assert from "node:assert/strict";
import { cleanName, productPart } from "../lib/clean.mjs";
test("odstrani besedilo vmesnika", () => {
  assert.equal(cleanName("Dodaj MLETO GOVEJE MESO, S-BUDGET, 500G"), "MLETO GOVEJE MESO, S-BUDGET, 500G");
  assert.equal(cleanName("Ni na voljo PURANJE MLETO MESO, VINDIJA, 400G"), "PURANJE MLETO MESO, VINDIJA, 400G");
  assert.equal(cleanName("Razvrsti po: CURRY, MEŠANICA ZAČIMB, MAESTRO, 40G"), "CURRY, MEŠANICA ZAČIMB, MAESTRO, 40G");
  assert.equal(cleanName('Rezultati za "banane" Razvrsti po:'), "");
  assert.equal(cleanName("BIO BIO BANANE, SPAR NATUR*PUR"), "BIO BANANE, SPAR NATUR*PUR");
});
test("ime izdelka brez znamke", () => {
  assert.equal(productPart("SVEŽE MLEKO 1,5% M.M., SPAR, 1L"), "SVEŽE MLEKO 1,5% M.M.");
  assert.equal(productPart("Trajno mleko brez zamaška, 1,5%"), "Trajno mleko brez zamaška");
});
