import test from "node:test"; import assert from "node:assert/strict";
import { mergeRun, keyOf } from "../lib/merge.mjs";
const o = (p, t = "2026-11-10T05:00:00Z") => ({ store: "Hofer", name: "Banane 1 kg", amount: 1, unit: "kg", price: p, checkedAt: t });
test("brez podvajanja, zgodovina ob spremembi", () => {
  let r = mergeRun({ offers: [] }, [o(1.49)], "2026-11-10T05:00:00Z");
  assert.equal(r.offers.length, 1); assert.equal(r.added, 1);
  r = mergeRun({ offers: r.offers }, [o(1.49, "2026-11-11T05:00:00Z")], "2026-11-11T05:00:00Z");
  assert.equal(r.offers.length, 1); assert.equal(r.hist.length, 0);
  r = mergeRun({ offers: r.offers }, [o(1.29, "2026-11-12T05:00:00Z")], "2026-11-12T05:00:00Z");
  assert.equal(r.changed, 1); assert.equal(r.offers[0].price, 1.29); assert.equal(r.hist[0].prev, 1.49);
});
test("ničelna cena ne prepiše zadnje veljavne", () => {
  const prev = { offers: [o(1.49)] };
  const r = mergeRun(prev, [o(0), o(NaN)], "2026-11-11T05:00:00Z");
  assert.equal(r.offers[0].price, 1.49);
});
test("stare ponudbe ostanejo, po 90 dneh izpadejo", () => {
  const prev = { offers: [o(1.49, "2026-11-01T00:00:00Z"), { ...o(2), name: "Staro", checkedAt: "2026-06-01T00:00:00Z" }] };
  const r = mergeRun(prev, [], "2026-11-11T05:00:00Z");
  assert.equal(r.offers.length, 1); assert.equal(keyOf(r.offers[0]), "Hofer|banane 1 kg|1|kg");
});
