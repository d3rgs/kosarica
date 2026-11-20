import { harvestAll } from "./harvest.mjs";
import { toOffers, stillValid } from "./match.mjs";
import { cleanName } from "./clean.mjs";
import { unitPrice } from "./normalize.mjs";
import { mergeRun } from "./merge.mjs";

// Zbere ponudbe iz trgovin. Napaka pri eni strani ali trgovini ne ustavi ostalih.
export async function collect({ stores, scan, foods, eanMap = {}, now, pause = async () => {}, deadline = Infinity }) {
  // Trgovine tečejo vzporedno (vsaka z lastnimi premori), da celoten zagon ostane v časovni omejitvi.
  const one = async (mod) => {
    const fresh = []; let n = 0, pages = 0, pagesOk = 0, cand = 0, err = null, cut = false; const errors = [], rej = [];
    try {
      for (const url of await mod.pages(foods)) {
        if (Date.now() > deadline) { cut = true; break; }
        pages++;
        try {
          const sc = mod.fetch ? await mod.fetch(url) : await scan(url, mod.scan || {}), st = {};
          let c = mod.cands ? mod.cands(sc) : harvestAll(sc);
          if (mod.enrich) c = await mod.enrich(c, { scan });
          const o = toOffers(mod.name, url, c, eanMap, now, st);
          fresh.push(...o); n += o.length; cand += c.length; pagesOk++;
          for (const x of st.rejected || []) if (rej.length < 12) rej.push(x);
        } catch (e) { err = String(e.message || e).slice(0, 160); if (errors.length < 3) errors.push(url.slice(0, 80) + ": " + err); console.log(`::warning::${mod.name} ${url}: ${err}`); }
        await pause(mod.delay);
      }
    } catch (e) { err = String(e.message || e).slice(0, 160); }
    if (cut) errors.push("časovna omejitev: preverjenih " + pages + " strani");
    return { fresh, name: mod.name, status: { ok: n > 0, offers: n, candidates: cand, pages, pagesOk, error: n > 0 ? null : err || "ni najdenih cen", errors, rejected: rej, checkedAt: now } };
  };
  const res = await Promise.all(stores.map(one));
  return { fresh: res.flatMap((r) => r.fresh), status: Object.fromEntries(res.map((r) => [r.name, r.status])) };
}
const up = (o) => o.unitPrice ?? unitPrice(o.price, o.amount, o.unit);
// Združi nove ponudbe s shranjenimi: shranjene preveri z današnjimi pravili, največ 5 najcenejših na trgovino in živilo.
// Previsoke ali prenizke primerjalne cene glede na mediano istega živila (pod 25 % ali nad 400 %) so skoraj gotovo napaka pri branju: ne shranimo jih.
export function dropOutliers(fresh) {
  const byFood = {}, dropped = [];
  for (const o of fresh) (byFood[o.food] ||= []).push(up(o));
  const med = {};
  for (const [f, a] of Object.entries(byFood)) if (a.length >= 4) { a.sort((x, y) => x - y); med[f] = a[Math.floor(a.length / 2)]; }
  const kept = fresh.filter((o) => { const m = med[o.food]; if (m && (up(o) < m * 0.25 || up(o) > m * 4)) { dropped.push(`${o.store}: ${o.name.slice(0, 40)} ${up(o).toFixed(2)} (mediana ${m.toFixed(2)})`); return false; } return true; });
  return { kept, dropped };
}
// Ročno pripravljene ponudbe (data/manual-offers.json), npr. iz zaslonskih slik letaka: sprejmemo samo popolne in še veljavne zapise.
export function acceptManual(list, now) {
  const UNITS = ["g", "kg", "ml", "l", "kos", "m", "cm"], day = now.slice(0, 10), out = [];
  for (const o of Array.isArray(list) ? list : []) {
    if (!o || !o.store || !o.food || !o.name || !(o.price > 0) || !(o.amount > 0) || !UNITS.includes(o.unit)) continue;
    if (o.validTo && String(o.validTo) < day) continue;
    const sale = o.regularPrice > o.price;
    out.push({ ...o, regularPrice: sale ? o.regularPrice : undefined, promoPrice: sale || o.kind === "akcija" ? o.price : undefined, kind: sale || o.kind === "akcija" ? "akcija" : o.kind || "redna", manual: true, checkedAt: String(o.checkedAt || now), matchConfidence: "ročno" });
  }
  return out;
}
export function finalize(prev, freshAll, now) {
  const old = (prev.offers || []).map((o) => ({ ...o, name: cleanName(o.name) })).filter(stillValid);
  const { kept: fresh, dropped } = dropOutliers(freshAll);
  const g = {};
  for (const o of fresh) (g[o.store + "|" + o.food] ||= []).push(o);
  const capped = Object.values(g).flatMap((a) => a.sort((x, y) => up(x) - up(y)).slice(0, 5));
  const m = mergeRun({ offers: old }, capped, now);
  // zastareli zapisi iz starejših različic (brez sku) izpadejo, če isti izdelek že imamo z oznako sku
  const withSku = new Set(m.offers.filter((o) => o.sku).map((o) => [o.store, cleanName(o.name).toLowerCase(), o.amount, o.unit].join("|")));
  m.offers = m.offers.filter((o) => o.sku || !withSku.has([o.store, cleanName(o.name).toLowerCase(), o.amount, o.unit].join("|")));
  const seen = new Set();
  m.offers = m.offers.filter((o) => { const k = [o.store, cleanName(o.name).toLowerCase(), o.amount, o.unit, o.price].join("|"); if (seen.has(k)) return false; seen.add(k); return true; });
  return { ...m, dropped };
}
