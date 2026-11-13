import { FOODS } from "../config/foods.mjs";
import { parsePack, family, unitPrice } from "./normalize.mjs";
import { cleanName, productPart } from "./clean.mjs";
// Pri sveži zelenjavi in sadju mora biti ime živila na začetku imena izdelka (BIO BANANE, DOLGE KUMARE), ne v sestavi (SKUTA BANANA).
const MOD = /^(bio|sveže|svež|sveža|dolge|dolga|mini|rdeče|rdeča|zrele|slovenske|italijanske|španske|tehtano|odlična kakovost|odlična|kakovost)\s+/i;
function leadWord(seg) { let s = seg; for (let i = 0; i < 4; i++) { const t = s.replace(MOD, ""); if (t === s) break; s = t; } return s.split(/\s+/)[0]; }
// Stopnje: high (znan EAN), medium (ime + pakiranje), low (pakiranje ne ustreza), null (ni ujemanja).
export function matchFood(o, eanMap = {}) {
  if (o.ean && eanMap[o.ean]) return { food: eanMap[o.ean], confidence: "high" };
  const name = cleanName(o.name || ""), seg = productPart(name) || name, full = [o.brand, name].filter(Boolean).join(" ");
  for (const f of FOODS) {
    if (!f.inc.test(seg) || (f.need && !f.need.test(full)) || (f.exc && f.exc.test(seg))) continue;
    if (f.lead && !f.inc.test(leadWord(seg))) continue;
    const p = parsePack(o.packText || full);
    if (p && family(p.unit) !== f.b) return { food: f.n, confidence: "low", reason: "pakiranje" };
    return { food: f.n, confidence: o.ean ? "high" : "medium" };
  }
  return { food: null, confidence: null };
}
// Pakiranje: iz podatka trgovine, imena ali (kot zadnja možnost) iz cene in primerjalne cene.
function derivePack(price, uv) {
  if (!(price > 0) || !uv || !(uv.value > 0)) return null;
  let a = price / uv.value;
  if (uv.unit === "kos") { if (Math.abs(a - Math.round(a)) / a > 0.03) return null; a = Math.round(a); } else a = +a.toFixed(3);
  return { amount: a, unit: uv.unit, label: `${String(a).replace(".", ",")} ${uv.unit}` };
}
export function toOffers(store, pageUrl, cands, eanMap, now, stats = {}) {
  const out = []; stats.unmatched ||= []; stats.rejected ||= [];
  for (const c of cands) {
    const name = cleanName(c.name);
    if (!name || !(c.price > 0)) continue;
    const m = matchFood({ ...c, name }, eanMap);
    if (!m.food) { if (stats.unmatched.length < 8) stats.unmatched.push(name.slice(0, 60)); continue; }
    if (m.confidence === "low") { stats.rejected.push(`${name.slice(0, 40)}: pakiranje`); continue; }
    const food = FOODS.find((f) => f.n === m.food);
    // jajca: število kosov v imenu (10/1, 18/1) velja, če ga potrdi primerjalna cena trgovine
    const nk = food && food.b === "kos" ? name.match(/\b(\d{1,3})\s?\/\s?1\b/) : null;
    const p = (nk && { amount: +nk[1], unit: "kos", label: `${nk[1]} kos` }) || parsePack(c.packText || [c.brand, name].filter(Boolean).join(" ")) || derivePack(c.price, c.unitPrice);
    if (!p) { stats.rejected.push(`${name.slice(0, 40)}: ni količine`); continue; }
    if (family(p.unit) !== food?.b && !(c.ean && eanMap[c.ean])) { stats.rejected.push(`${name.slice(0, 40)}: enota`); continue; }
    // primerjalno ceno trgovine uporabimo samo, če se ujema s ceno pakiranja (največ 4 % razlike)
    const mine = unitPrice(c.price, p.amount, p.unit); let up;
    if (c.unitPrice && c.unitPrice.value > 0 && c.unitPrice.unit === family(p.unit)) {
      if (Math.abs(c.unitPrice.value / mine - 1) <= 0.04) up = c.unitPrice.value;
      else { stats.rejected.push(`${name.slice(0, 40)}: primerjalna cena ${c.unitPrice.value.toFixed(2)} ≠ ${mine.toFixed(2)}`); continue; }
    }
    let url = pageUrl; try { if (c.url) url = new URL(c.url, pageUrl).href; } catch {}
    const sale = c.regularPrice > c.price;
    out.push({
      store, food: m.food, sku: c.sku, ean: c.ean, brand: c.brand, name, amount: p.amount, unit: p.unit, pack: p.label,
      price: c.price, regularPrice: sale ? c.regularPrice : undefined, promoPrice: sale ? c.price : undefined, unitPrice: up, lowest30: c.lowest30,
      kind: c.loyalty ? "klub" : sale ? "akcija" : "redna", loyalty: c.loyalty, validFrom: c.validFrom, validTo: c.validTo,
      url, img: c.img, checkedAt: now, matchConfidence: m.confidence,
    });
  }
  return out;
}
// Preveri že shranjeno ponudbo z današnjimi pravili. Napačna ali neustrezna ujemanja izpadejo.
export function stillValid(o) {
  const m = matchFood({ name: o.name, brand: o.brand, packText: `${o.amount} ${o.unit}`, ean: o.ean });
  return m.food === o.food && m.confidence !== "low";
}
