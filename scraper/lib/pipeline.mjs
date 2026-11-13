import { harvestAll } from "./harvest.mjs";
import { toOffers, stillValid } from "./match.mjs";
import { cleanName } from "./clean.mjs";
import { unitPrice } from "./normalize.mjs";
import { mergeRun } from "./merge.mjs";

// Zbere ponudbe iz trgovin. Napaka pri eni strani ali trgovini ne ustavi ostalih.
export async function collect({ stores, scan, foods, eanMap = {}, now, pause = async () => {} }) {
  const fresh = [], status = {};
  for (const mod of stores) {
    let n = 0, pages = 0, pagesOk = 0, cand = 0, err = null; const errors = [], rej = [];
    try {
      for (const url of await mod.pages(foods)) {
        pages++;
        try {
          const sc = await scan(url, mod.scan || {}), c = mod.cands ? mod.cands(sc) : harvestAll(sc), st = {};
          const o = toOffers(mod.name, url, c, eanMap, now, st);
          fresh.push(...o); n += o.length; cand += c.length; pagesOk++;
          for (const x of st.rejected || []) if (rej.length < 12) rej.push(x);
        } catch (e) { err = String(e.message || e).slice(0, 160); if (errors.length < 3) errors.push(url.slice(0, 80) + ": " + err); console.log(`::warning::${mod.name} ${url}: ${err}`); }
        await pause();
      }
    } catch (e) { err = String(e.message || e).slice(0, 160); }
    status[mod.name] = { ok: n > 0, offers: n, candidates: cand, pages, pagesOk, error: n > 0 ? null : err || "ni najdenih cen", errors, rejected: rej, checkedAt: now };
  }
  return { fresh, status };
}
const up = (o) => o.unitPrice ?? unitPrice(o.price, o.amount, o.unit);
// Združi nove ponudbe s shranjenimi: shranjene preveri z današnjimi pravili, največ 5 najcenejših na trgovino in živilo.
export function finalize(prev, fresh, now) {
  const old = (prev.offers || []).map((o) => ({ ...o, name: cleanName(o.name) })).filter(stillValid);
  const g = {};
  for (const o of fresh) (g[o.store + "|" + o.food] ||= []).push(o);
  const capped = Object.values(g).flatMap((a) => a.sort((x, y) => up(x) - up(y)).slice(0, 5));
  return mergeRun({ offers: old }, capped, now);
}
