import { FOODS } from "../config/foods.mjs";
import { parsePack, family } from "./normalize.mjs";
import { cleanName, productPart } from "./clean.mjs";
// Stopnje: high (znan EAN), medium (ime + pakiranje), low (pakiranje ne ustreza), null (ni ujemanja).
export function matchFood(o, eanMap = {}) {
  if (o.ean && eanMap[o.ean]) return { food: eanMap[o.ean], confidence: "high" };
  const name = cleanName(o.name || ""), seg = productPart(name) || name, full = [o.brand, name].filter(Boolean).join(" ");
  for (const f of FOODS) {
    if (!f.inc.test(seg) || (f.need && !f.need.test(full)) || (f.exc && f.exc.test(seg))) continue;
    const p = parsePack(o.packText || full);
    if (!p || family(p.unit) !== f.b) return { food: f.n, confidence: "low", reason: "pakiranje" };
    return { food: f.n, confidence: o.ean ? "high" : "medium" };
  }
  return { food: null, confidence: null };
}
export function toOffers(store, pageUrl, cands, eanMap, now) {
  const out = [];
  for (const c of cands) {
    const name = cleanName(c.name);
    const m = matchFood({ ...c, name }, eanMap);
    if (!m.food || m.confidence === "low") continue;
    const p = parsePack(c.packText || [c.brand, name].filter(Boolean).join(" "));
    if (!p || !(c.price > 0)) continue;
    let url = pageUrl;
    try { if (c.url) url = new URL(c.url, pageUrl).href; } catch {}
    out.push({
      store, food: m.food, sku: c.sku, ean: c.ean, brand: c.brand, name,
      amount: p.amount, unit: p.unit, pack: p.label, price: c.price, regularPrice: c.regularPrice, promoPrice: c.promoPrice,
      kind: c.promoPrice > 0 ? "akcija" : "redna", url, checkedAt: now, matchConfidence: m.confidence,
    });
  }
  return out;
}
// Preveri že shranjeno ponudbo z današnjimi pravili. Napačna ali neustrezna ujemanja izpadejo.
export function stillValid(o) {
  const m = matchFood({ name: o.name, brand: o.brand, packText: `${o.amount} ${o.unit}`, ean: o.ean });
  return m.food === o.food && m.confidence !== "low";
}
