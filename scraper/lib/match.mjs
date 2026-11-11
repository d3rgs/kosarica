import { FOODS } from "../config/foods.mjs";
import { parsePack, family } from "./normalize.mjs";
// Stopnje: high (EAN ali EAN + besedilo), medium (besedilo + pakiranje), low (pakiranje ne ustreza), null (ni ujemanja).
export function matchFood(o, eanMap = {}) {
  const hay = [o.brand, o.name].filter(Boolean).join(" ");
  if (o.ean && eanMap[o.ean]) return { food: eanMap[o.ean], confidence: "high" };
  for (const f of FOODS) {
    if (!f.inc.test(hay) || (f.need && !f.need.test(hay)) || (f.exc && f.exc.test(hay))) continue;
    const p = parsePack(o.packText || hay);
    if (!p || family(p.unit) !== f.b) return { food: f.n, confidence: "low", reason: "pakiranje" };
    return { food: f.n, confidence: o.ean ? "high" : "medium" };
  }
  return { food: null, confidence: null };
}
export function toOffers(store, pageUrl, cands, eanMap, now) {
  const out = [];
  for (const c of cands) {
    const m = matchFood(c, eanMap);
    if (!m.food || m.confidence === "low") continue;
    const p = parsePack(c.packText || [c.brand, c.name].filter(Boolean).join(" "));
    if (!p || !(c.price > 0)) continue;
    let url = pageUrl;
    try { if (c.url) url = new URL(c.url, pageUrl).href; } catch {}
    out.push({
      store, food: m.food, sku: c.sku, ean: c.ean, brand: c.brand, name: c.name,
      amount: p.amount, unit: p.unit, price: c.price, regularPrice: c.regularPrice, promoPrice: c.promoPrice,
      kind: c.promoPrice > 0 ? "akcija" : "redna", url, checkedAt: now, matchConfidence: m.confidence,
    });
  }
  return out;
}
