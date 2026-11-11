import { toNum, parsePack } from "./normalize.mjs";
import { cleanName } from "./clean.mjs";
const pick = (o, keys) => { for (const k of keys) { const v = o[k]; if (v !== undefined && v !== null && v !== "") return v; } };
const num = (v) => { if (v && typeof v === "object") v = pick(v, ["value", "amount", "current", "regular", "min", "gross"]); return toNum(v); };
export function walk(x, cb, d = 0) {
  if (d > 12 || x == null) return;
  if (Array.isArray(x)) { x.forEach((i) => walk(i, cb, d + 1)); return; }
  if (typeof x === "object") { cb(x); Object.values(x).forEach((v) => walk(v, cb, d + 1)); }
}
export function fromJson(root) {
  const out = [];
  walk(root, (o) => {
    const name = pick(o, ["name", "title", "productName", "displayName", "naziv"]);
    if (typeof name !== "string" || name.length < 3) return;
    const price = num(pick(o, ["currentPrice", "sellingPrice", "price", "finalPrice", "priceValue", "salePrice", "regularPrice"]));
    if (!(price > 0)) return;
    const promo = num(pick(o, ["salePrice", "promoPrice", "discountPrice"]));
    const reg = num(pick(o, ["regularPrice", "originalPrice", "oldPrice", "wasPrice", "listPrice"]));
    const b = pick(o, ["brand", "brandName", "manufacturer"]);
    const e = pick(o, ["ean", "gtin", "gtin13", "gtin8", "barcode", "barcodes"]);
    const sku = pick(o, ["sku", "productId", "itemId", "id", "code"]);
    out.push({
      name: name.trim(), brand: typeof b === "object" ? b?.name : b,
      ean: String(Array.isArray(e) ? e[0] : e ?? "").replace(/\D/g, "") || undefined,
      sku: sku != null ? String(sku) : undefined, price,
      promoPrice: promo > 0 && promo < price ? promo : undefined,
      regularPrice: reg > price ? reg : undefined,
      packText: pick(o, ["quantity", "packSize", "netQuantity", "unitSize", "size", "weight"]),
      url: pick(o, ["url", "link", "canonicalUrl"]),
    });
  });
  return out;
}
export function fromJsonLd(html) {
  const out = [];
  for (const m of String(html).matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]), (o) => {
        if (![].concat(o["@type"] || []).includes("Product")) return;
        const of = [].concat(o.offers || [])[0] || {};
        const price = num(of.price ?? of.lowPrice);
        if (!(price > 0) || !o.name) return;
        out.push({
          name: o.name, brand: o.brand?.name ?? o.brand,
          ean: String(o.gtin13 ?? o.gtin ?? o.gtin8 ?? "").replace(/\D/g, "") || undefined,
          sku: o.sku ? String(o.sku) : undefined, price, url: o.url || of.url,
        });
      });
    } catch {}
  }
  return out;
}
export function fromRsc(text) {
  const out = [];
  for (const line of String(text).split("\n")) {
    const m = line.match(/^[0-9a-f]+:([\[{].*)$/i);
    if (!m) continue;
    try { out.push(...fromJson(JSON.parse(m[1]))); } catch {}
  }
  return out;
}
// Hevristika za strani, ki ime, količino in ceno izrišejo v zaporednih vrsticah. Vrstice vmesnika (Dodaj, Razvrsti po ...) preskoči.
const PRICE_ONLY = /^\d{1,4}[.,]\d{2}\s?€$/;
const isPackLine = (s) => /^[\d(]/.test(s) && s.length < 40 && (parsePack(s) || /€\s?\/|eur\//i.test(s));
export function fromText(text) {
  const L = String(text).split("\n").map((s) => s.trim()).filter(Boolean), out = [];
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/^(\d{1,4}[.,]\d{2})\s?€$/);
    if (!m) continue;
    let pack = null; const names = [];
    for (let j = i - 1; j >= Math.max(0, i - 6) && names.length < 2; j--) {
      const s = L[j];
      if (PRICE_ONLY.test(s)) break;
      if (isPackLine(s)) { if (!pack) pack = parsePack(s); continue; }
      const c = cleanName(s);
      if (c && /[A-Za-zČŠŽčšž]{3}/.test(c) && !/€/.test(c)) names.unshift(c);
    }
    if (names.length) out.push({ name: names.join(" "), price: parseFloat(m[1].replace(",", ".")), packText: pack ? pack.label : undefined });
  }
  return out;
}
export function harvestAll({ html = "", text = "", jsons = [], rscs = [] }) {
  const all = [
    ...fromJsonLd(html).map((x) => ({ ...x, via: "jsonld" })),
    ...jsons.flatMap((j) => fromJson(j)).map((x) => ({ ...x, via: "json" })),
    ...rscs.flatMap(fromRsc).map((x) => ({ ...x, via: "rsc" })),
    ...fromText(text).map((x) => ({ ...x, via: "text" })),
  ];
  const seen = new Set();
  all.forEach((x) => { x.name = cleanName(x.name); });
  return all.filter((x) => x.name).filter((x) => { const k = (x.ean || x.sku || x.name.toLowerCase()) + "|" + x.price; if (seen.has(k)) return false; seen.add(k); return true; });
}
