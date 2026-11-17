import { parsePack, family } from "./normalize.mjs";
// Slike: 1) slika trgovine, 2) Open Food Facts po EAN, 3) previdno iskanje po znamki, imenu in količini. Ob dvomu slike ne prikažemo.
export const OFF_UA = "KosaricaAI/1.0 (https://github.com/d3rgs/kosarica)";
const FIELDS = "code,product_name,brands,quantity,image_front_url";
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const toks = (s) => new Set(norm(s).split(" ").filter((t) => t.length > 2 && !/^\d+$/.test(t)));
const jac = (a, b) => { const A = toks(a), B = toks(b); if (!A.size || !B.size) return 0; let i = 0; for (const t of A) if (B.has(t)) i++; return i / (A.size + B.size - i); };
const factor = { g: 0.001, kg: 1, ml: 0.001, l: 1, kos: 1, cm: 0.01, m: 1 };
const baseAmt = (q) => q.amount * (factor[q.unit] ?? NaN);
// Ali se izdelek iz Open Food Facts zanesljivo ujema z našo ponudbo? Vrne { ok, why }.
export function offAccept(offer, p, byEan) {
  if (!p || !p.image_front_url) return { ok: false, why: "ni slike sprednje strani" };
  const q = parsePack(p.quantity);
  if (!q) return { ok: false, why: "OFF brez količine" };
  if (family(q.unit) !== family(offer.unit)) return { ok: false, why: "druga vrsta količine" };
  const a = baseAmt(q), b = baseAmt({ amount: offer.amount, unit: offer.unit });
  if (!(Math.abs(a - b) / b <= 0.02)) return { ok: false, why: "količina se ne ujema" };
  if (offer.brand && !(norm(p.brands).includes(norm(offer.brand)) || norm(offer.brand).includes(norm(p.brands).split(" ")[0] || "#"))) return { ok: false, why: "znamka se ne ujema" };
  if (jac(offer.name, p.product_name) < (byEan ? 0.34 : 0.5)) return { ok: false, why: "ime se ne ujema" };
  return { ok: true };
}
export async function enrichImages(offers, cache = {}, { fetch = globalThis.fetch, now = new Date().toISOString(), maxEan = 40, maxSearch = 12, pause = async () => {} } = {}) {
  let ean = 0, search = 0; const stats = { store: 0, off: 0, none: 0, cached: 0, skipped: 0 };
  const age = (t) => (Date.parse(now) - Date.parse(t)) / 864e5;
  const get = async (url) => { const r = await fetch(url, { headers: { "user-agent": OFF_UA } }); if (!r.ok) throw new Error("OFF HTTP " + r.status); return r.json(); };
  for (const o of offers) {
    if (o.img) { o.imgSource = o.imgSource || "trgovina"; stats.store++; continue; }
    const key = o.ean ? "ean:" + o.ean : "n:" + norm([o.brand, o.name, o.amount, o.unit].join(" "));
    const c = cache[key];
    if (c && age(c.t) < (c.ok ? 60 : 7)) { if (c.ok) { o.img = c.url; o.imgSource = "off"; o.imgCode = c.code; stats.off++; } else stats.none++; stats.cached++; continue; }
    try {
      let hit = null;
      if (o.ean) {
        if (ean++ >= maxEan) { stats.skipped++; continue; }
        const j = await get(`https://world.openfoodfacts.org/api/v2/product/${o.ean}.json?fields=${FIELDS}`); await pause();
        if (j.status === 1 && offAccept(o, j.product, true).ok) hit = j.product;
      } else if (o.brand) {
        if (search++ >= maxSearch) { stats.skipped++; continue; }
        const j = await get(`https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=8&fields=${FIELDS}&search_terms=${encodeURIComponent([o.brand, o.name].join(" "))}&tagtype_0=countries&tag_contains_0=contains&tag_0=slovenia`); await pause(6500);
        const ok = (j.products || []).filter((p) => offAccept(o, p, false).ok);
        if (ok.length === 1) hit = ok[0];                                   // dvoumno ujemanje = brez slike
      } else { stats.skipped++; continue; }
      cache[key] = hit ? { ok: true, url: hit.image_front_url, code: hit.code, t: now } : { ok: false, t: now };
      if (hit) { o.img = hit.image_front_url; o.imgSource = "off"; o.imgCode = hit.code; stats.off++; } else stats.none++;
    } catch (e) { console.log("::warning::OFF: " + e.message); }
  }
  return stats;
}
