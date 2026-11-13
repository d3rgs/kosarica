import { extractSpar } from "../lib/dom.mjs";
import { sparCands } from "../lib/cands.mjs";
// SPAR Online: rezultati iskanja so kartice izdelkov (data-product-sku) z imenom, ceno, primerjalno ceno in morebitno »Prej« ceno.
export default {
  name: "SPAR",
  pages: (foods) => [...new Set(foods.flatMap((f) => f.q.map((q) => `https://online.spar.si/search?name=${encodeURIComponent(q)}`)))],
  scan: { evaluate: extractSpar, waitFor: "[data-product-sku]" },
  cands: (scan) => sparCands(scan.dom),
};
