import { extractSpar } from "../lib/dom.mjs";
import { sparCands } from "../lib/cands.mjs";
import { queriesFor } from "../config/foods.mjs";
// SPAR Online: rezultati iskanja so kartice izdelkov (data-product-sku) z imenom, ceno, primerjalno ceno in morebitno »Prej« ceno.
export default {
  name: "SPAR",
  pages: (foods) => [...new Set(foods.flatMap((f) => queriesFor(f)).map((q) => `https://online.spar.si/search?name=${encodeURIComponent(q)}`))],
  scan: { evaluate: extractSpar, waitFor: "[data-product-sku]", scrolls: 5 },
  cands: (scan) => sparCands(scan.dom),
};
