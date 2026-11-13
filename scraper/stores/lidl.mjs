import { extractLidl } from "../lib/dom.mjs";
import { lidlCands } from "../lib/cands.mjs";
// Lidl: kategorije s karticami izdelkov (ime, cena, prečrtana redna cena, »Od .. do ..«). Povezave do kategorij preberemo z začetne strani.
const FOOD = /sadje|zelenjav|meso|mleč|mlec|jajca|zamrznj|pekovsk|sir|ribe|konserv|začimb|zacimb|kosmič|kosmic|kakav|hrana|ponudb/i;
export default {
  name: "Lidl",
  pages: async () => {
    let cats = [];
    try {
      const html = await (await fetch("https://www.lidl.si/", { headers: { "user-agent": "KosaricaAI-osebna-primerjava/1.0" } })).text();
      cats = [...new Set([...html.matchAll(/href="(\/h\/[^"#?]+)"/g)].map((m) => m[1]))].filter((u) => FOOD.test(u)).slice(0, 12).map((u) => "https://www.lidl.si" + u);
    } catch (e) { console.log("::warning::Lidl kategorije: " + e.message); }
    return [...new Set(["https://www.lidl.si/h/sadje-in-zelenjava/h10071012", ...cats])];
  },
  scan: { evaluate: extractLidl, waitFor: ".product-grid-box" },
  cands: (scan) => lidlCands(scan.dom),
};
