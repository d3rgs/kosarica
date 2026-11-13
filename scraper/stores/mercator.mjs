import fs from "node:fs";
import { extractMercator } from "../lib/dom.mjs";
import { mercatorCands } from "../lib/cands.mjs";
// Iskanje po spletni trgovini (hash #search=). Vejic in znaka % ne pošiljamo: stran jih dvojno kodira in iskanje odpove.
const f = new URL("../config/mercator-urls.txt", import.meta.url);
const clean = (q) => q.replace(/(\d),(\d)/g, "$1.$2").replace(/[,%]/g, " ").replace(/\s+/g, " ").trim();
export default {
  name: "Mercator",
  pages: (foods) => [
    ...(fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").map((s) => s.trim()).filter((s) => s.startsWith("http")) : []),
    ...[...new Set(foods.flatMap((x) => x.q.map(clean)))].map((q) => `https://mercatoronline.si/brskaj#search=${encodeURIComponent(q)}`),
  ],
  scan: { evaluate: extractMercator, waitFor: "a.lib-product-name" },
  cands: (scan) => mercatorCands(scan.dom),
};
