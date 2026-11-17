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
      unitPrice: normalizeUnitPrice(i.pum), unitText: i.pum || undefined, lowest30: lo ? euro(lo[1]) : undefined, url: abs(i.url, "https://online.spar.si"), img: i.img || undefined };
  });
}
export function mercatorCands(items) {
  return (items || []).filter((i) => i.name).map((i) => {
    const price = euro(i.price), old = euro(i.old), pc = euro(String(i.pc30 || "").replace(/pc30:?/i, ""));
    const ok = /^\d{4}/.test(i.expires || "") && i.expires > "2000";
    return { name: cleanName(i.name), sku: (String(i.url).match(/izdelek\/(\d+)/) || [])[1], price, regularPrice: old > price ? old : undefined,
      unitPrice: normalizeUnitPrice(i.pum), unitText: i.pum || undefined, lowest30: pc > 0 ? pc : undefined, validTo: ok ? i.expires : undefined, url: abs(i.url, "https://mercatoronline.si"), img: abs(i.img, "https://mercatoronline.si") };
  });
}
// Lidl: "Od 05.11. do 11.11." brez leta; cena je lahko na kg ("za kg"), na kos ("za kos") ali na pakiranje.
export function lidlCands(items, now = new Date()) {
  const y = now.getUTCFullYear();
  return (items || []).filter((i) => i.title).map((i) => {
    const t = i.text || "", price = euro(i.price), stroke = euro(i.stroke), name = cleanName(i.title);
    let pack = null;
    const ex = t.match(/(\d+(?:[.,]\d+)?)\s?(g|kg|ml|l|kos)\b(?!\s*=)/i);        // »500 g«, »10 kos« (ne »1 kg = 1,78«)
    if (ex && !/^(za kg|za l)/i.test(ex[0])) pack = { label: `${ex[1]} ${ex[2]}`, explicit: true };
    else if (/za kg/i.test(t)) pack = { label: "1 kg", unit: "kg" };
    else if (/za l\b/i.test(t)) pack = { label: "1 l", unit: "l" };
    else if (/za kos|(^|[^a-zčšž])kos(?![a-zčšž])/i.test(t)) pack = { label: "1 kos", unit: "kos" };
    const d = t.match(/Od\s+(\d{1,2})\.(\d{1,2})\.\s+do\s+(\d{1,2})\.(\d{1,2})\./);
    const from = d ? iso(y, d[2], d[1]) : undefined, to = d ? iso(+d[4] < +d[2] ? y + 1 : y, d[4], d[3]) : undefined;
    return { name, price, regularPrice: stroke > price ? stroke : undefined, packText: pack ? pack.label : undefined,
      unitPrice: pack && !pack.explicit ? { value: price, unit: pack.unit } : undefined, unitText: pack && !pack.explicit ? "za " + pack.unit : undefined, loyalty: /Lidl Plus/i.test(t) || undefined, validFrom: from, validTo: to,
      url: abs(i.url, "https://www.lidl.si"), img: abs(i.img, "https://www.lidl.si") };
  });
}
export function hoferToCand(p) {
  const c = (n) => (typeof n === "number" ? n / 100 : NaN), pr = p.price || {};
  const price = c(pr.amountRelevant ?? pr.amount), was = euro(pr.wasPriceDisplay);
  const a = (p.assets || []).find((x) => x && x.url);
  return { name: cleanName(p.name), brand: p.brandName || undefined, sku: p.sku, price, regularPrice: was > price ? was : undefined, packText: p.sellingSize || undefined,
    unitPrice: normalizeUnitPrice(pr.comparisonDisplay), unitText: pr.comparisonDisplay || undefined, url: `https://www.hofer.si/izdelek/${p.urlSlugText}-${p.sku}`,
    img: a ? a.url.replace("{width}", "400").replace("{slug}", p.urlSlugText || "izdelek") : undefined };
}
export const hoferCands = (html) => hoferProducts(html).map(hoferToCand);

const decode = (s) => String(s ?? "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
// Tuš (WooCommerce Store API): cene v centih. Za ceno velja polje price (to prikaže tudi trgovina); sale_price ob price = regular_price ni potrjen kot veljavna cena in se ne uporablja.
export function tusCands(items) {
  return (Array.isArray(items) ? items : []).filter((i) => i && i.name && i.prices && i.is_in_stock !== false).map((i) => {
    const mu = 10 ** (+i.prices.currency_minor_unit || 2), n = (k) => { const v = parseFloat(i.prices[k]); return v >= 0 ? v / mu : NaN; };
    const price = n("price"), reg = n("regular_price");
    return { name: cleanName(decode(i.name)), sku: String(i.sku || i.id), price, regularPrice: reg > price ? reg : undefined, url: i.permalink,
      img: (i.images && i.images[0] && i.images[0].src) || undefined };
  }).filter((c) => c.price > 0);
}
// Eurospin »Akcija«: bloki z datumom (12.11 - 18.11), imenom, znamko, redno in akcijsko ceno ter količino (400 g - za kg 6,23 €).
const PACKLINE = /^(?:\d+\s?[x×]\s?)?\d+(?:[.,]\d+)?\s?(?:kg|g|ml|l)\b/i;
export function eurospinCands(text, now = new Date()) {
  const y = now.getUTCFullYear(), out = [];
  const L = String(text).split("\n").map((s) => s.replace(/[*#]/g, "").replace(/!\[\]\([^)]*\)/g, "").trim()).filter(Boolean);
  const starts = L.map((s, i) => (/^\d{1,2}\.\d{1,2}\.?\s*-\s*\d{1,2}\.\d{1,2}\.?$/.test(s) ? i : -1)).filter((i) => i >= 0);
  starts.forEach((si, k) => {
    const b = L.slice(si + 1, starts[k + 1] ?? L.length), d = L[si].match(/(\d{1,2})\.(\d{1,2})\.?\s*-\s*(\d{1,2})\.(\d{1,2})/);
    const title = b.find((s) => /[A-Za-zČŠŽčšž]{3}/.test(s)); if (!title) return;
    let brand, packLine; const prices = [];
    for (const s of b.slice(b.indexOf(title) + 1)) {
      if (!packLine && PACKLINE.test(s)) { packLine = s; break; }
      const nums = [...s.matchAll(/(\d{1,3},\d{2})/g)].map((m) => parseFloat(m[1].replace(",", ".")));
      if (nums.length && /^[\d,.\s€]+(za kos)?$/i.test(s)) prices.push(...nums);
      else if (!brand && /^[A-ZČŠŽÀ-Ý0-9' .&-]{3,40}$/.test(s) && !/\d,\d{2}/.test(s)) brand = s;
    }
    if (!prices.length || !packLine) return;
    const price = prices[prices.length - 1], reg = prices.length > 1 ? Math.max(...prices) : undefined;
    const iso = (yy, m, dd) => `${yy}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    out.push({ name: cleanName(title), brand, price, regularPrice: reg > price ? reg : undefined, packText: packLine, unitPrice: normalizeUnitPrice(packLine), unitText: packLine,
      validFrom: iso(y, d[2], d[1]), validTo: iso(+d[4] < +d[2] ? y + 1 : y, d[4], d[3]), forceSale: true, url: "https://www.eurospin.si/akcije/" });
  });
  return out;
}
