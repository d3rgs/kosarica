import { extractLidl } from "../lib/dom.mjs";
import { lidlCands } from "../lib/cands.mjs";
import { fromJsonLd } from "../lib/harvest.mjs";
import { lidlEans } from "../lib/nuxt.mjs";
import { discoverFlyerProducts } from "../lib/lidl-flyer.mjs";
import { FOODS } from "../config/foods.mjs";
// Lidl: 1) kategorije s karticami izdelkov (ime, cena, prečrtana redna cena, »Od .. do ..«), 2) izdelki iz aktualnih letakov (esi.leaflets.schwarz),
// katerih strani izdelkov imajo ceno (JSON-LD). Lidl rednih cen živil na spletu ne objavlja, cene so samo pri akcijah.
const FOOD = /hrana|sadje|zelenjav|meso|perutnin|govedin|svinjin|ribe|mleč|mlec|jajca|zamrznj|pekovsk|sir|konserv|začimb|zacimb|olj|kosmič|kosmic|kakav|testenin|čistil|cistil|gospodinj|higien|nega|papir|kozmet|pralni|pomival|ponudb/i;
const tracked = (t) => FOODS.some((f) => f.inc.test(t) && !(f.exc && f.exc.test(t)));
export default {
  name: "Lidl",
  pages: async () => {
    let cats = [], fly = [];
    try {
      const html = await (await fetch("https://www.lidl.si/", { headers: { "user-agent": "KosaricaAI-osebna-primerjava/1.0" } })).text();
      cats = [...new Set([...html.matchAll(/href="(\/h\/[^"#?]+)"/g)].map((m) => m[1]))].filter((u) => FOOD.test(u)).slice(0, 30).map((u) => "https://www.lidl.si" + u);
    } catch (e) { console.log("::warning::Lidl kategorije: " + e.message); }
    try { fly = (await discoverFlyerProducts()).products.filter((p) => tracked(p.title)).map((p) => p.url).slice(0, 40); }
    catch (e) { console.log("::warning::Lidl letaki: " + e.message); }
    return [...new Set(["https://www.lidl.si/h/sadje-in-zelenjava/h10071012", ...cats, ...fly])];
  },
  scan: { evaluate: extractLidl, waitFor: ".product-grid-box,script[type='application/ld+json']" },
  cands: (scan) => {
    const t = lidlCands(scan.dom);
    if (t.length) return t;
    const eans = lidlEans(scan.html || "");                                   // stran izdelka: cena iz JSON-LD, EAN iz podatkov strani
    return fromJsonLd(scan.html || "").map((c) => ({ ...c, ean: c.ean || eans[0] || undefined }));
  },
};
