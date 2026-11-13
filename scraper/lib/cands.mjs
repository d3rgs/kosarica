import { parsePack, parsePrice, normalizeUnitPrice } from "./normalize.mjs";
import { cleanName } from "./clean.mjs";
import { hoferProducts } from "./nuxt.mjs";

const euro = (s) => { const t = String(s ?? ""); return parsePrice(/€|eur/i.test(t) ? t : t + " €"); };
const abs = (u, base) => { try { return new URL(u, base).href; } catch { return undefined; } };
const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function sparCands(items) {
  return (items || []).filter((i) => i.name && !/ni na voljo/i.test(i.text || "")).map((i) => {
    const price = euro(i.price), hist = euro(String(i.hist || "").replace(/prej/i, ""));
    const m2 = String(i.pum || "").match(/^\s*(\d+(?:[.,]\d+)?)\s?(kg|l|kos|m)\b/i), lo = String(i.text || "").match(/PC30:\s*([\d.,]+)\s?€/i);
    return { name: cleanName(i.name), sku: i.sku, price, regularPrice: hist > price ? hist : undefined, packText: m2 ? `${m2[1]} ${m2[2]}` : undefined,
      unitPrice: normalizeUnitPrice(i.pum), lowest30: lo ? euro(lo[1]) : undefined, url: abs(i.url, "https://online.spar.si"), img: i.img || undefined };
  });
}
export function mercatorCands(items) {
  return (items || []).filter((i) => i.name).map((i) => {
    const price = euro(i.price), old = euro(i.old), pc = euro(String(i.pc30 || "").replace(/pc30:?/i, ""));
    const ok = /^\d{4}/.test(i.expires || "") && i.expires > "2000";
    return { name: cleanName(i.name), sku: (String(i.url).match(/izdelek\/(\d+)/) || [])[1], price, regularPrice: old > price ? old : undefined,
      unitPrice: normalizeUnitPrice(i.pum), lowest30: pc > 0 ? pc : undefined, validTo: ok ? i.expires : undefined, url: abs(i.url, "https://mercatoronline.si"), img: abs(i.img, "https://mercatoronline.si") };
  });
}
// Lidl: "Od 05.11. do 11.11." brez leta; cena je lahko na kg ("za kg"), na kos ("za kos") ali na pakiranje.
export function lidlCands(items, now = new Date()) {
  const y = now.getUTCFullYear();
  return (items || []).filter((i) => i.title).map((i) => {
    const t = i.text || "", price = euro(i.price), stroke = euro(i.stroke), name = cleanName(i.title);
    let pack = null;
    if (/za kg|1 kg\s*=/i.test(t)) pack = { label: "1 kg", unit: "kg" };
    else if (/za l\b|1 l\s*=/i.test(t)) pack = { label: "1 l", unit: "l" };
    else if (/za kos|(^|[^a-zčšž])kos(?![a-zčšž])/i.test(t)) pack = { label: "1 kos", unit: "kos" };
    const d = t.match(/Od\s+(\d{1,2})\.(\d{1,2})\.\s+do\s+(\d{1,2})\.(\d{1,2})\./);
    const from = d ? iso(y, d[2], d[1]) : undefined, to = d ? iso(+d[4] < +d[2] ? y + 1 : y, d[4], d[3]) : undefined;
    return { name, price, regularPrice: stroke > price ? stroke : undefined, packText: pack ? pack.label : undefined,
      unitPrice: pack ? { value: price, unit: pack.unit } : undefined, loyalty: /Lidl Plus/i.test(t) || undefined, validFrom: from, validTo: to,
      url: abs(i.url, "https://www.lidl.si"), img: abs(i.img, "https://www.lidl.si") };
  });
}
export function hoferToCand(p) {
  const c = (n) => (typeof n === "number" ? n / 100 : NaN), pr = p.price || {};
  const price = c(pr.amountRelevant ?? pr.amount), was = euro(pr.wasPriceDisplay);
  const a = (p.assets || []).find((x) => x && x.url);
  return { name: cleanName(p.name), brand: p.brandName || undefined, sku: p.sku, price, regularPrice: was > price ? was : undefined, packText: p.sellingSize || undefined,
    unitPrice: normalizeUnitPrice(pr.comparisonDisplay), url: `https://www.hofer.si/izdelek/${p.urlSlugText}-${p.sku}`,
    img: a ? a.url.replace("{width}", "400").replace("{slug}", p.urlSlugText || "izdelek") : undefined };
}
export const hoferCands = (html) => hoferProducts(html).map(hoferToCand);
