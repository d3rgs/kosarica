export const keyOf = (o) => [o.store, o.ean || o.sku || String(o.name).toLowerCase(), o.amount, o.unit].join("|");
const cur = (o) => o.promoPrice > 0 ? o.promoPrice : o.price;
const day = (s) => String(s).slice(0, 10);
// Nove ponudbe združi s prejšnjimi. Ničelnih ali neveljavnih cen ne sprejme, starih ne briše (po 90 dneh jih opusti).
// Vsaka ponudba hrani zgodovino lastne cene (h: [{d, p}]) in datum prve zaznave (fs): samo iz tega aplikacija sme sklepati o rekordih in padcih.
export function mergeRun(prev, fresh, now = new Date().toISOString()) {
  const map = new Map((prev.offers || []).map((o) => [keyOf(o), o]));
  const hist = []; let added = 0, changed = 0;
  for (const o of fresh) {
    if (!(o.price > 0) || !o.store || !o.name) continue;
    const k = keyOf(o), p = map.get(k);
    if (!p) { added++; hist.push({ t: now, k, price: cur(o) }); map.set(k, { ...o, fs: day(now), h: [{ d: day(now), p: cur(o) }] }); continue; }
    let h = p.h && p.h.length ? p.h.slice() : [{ d: day(p.checkedAt), p: cur(p) }];
    if (cur(p) !== cur(o)) { changed++; hist.push({ t: now, k, price: cur(o), prev: cur(p) }); h.push({ d: day(now), p: cur(o) }); }
    map.set(k, { ...p, ...o, fs: p.fs || day(p.checkedAt), h: h.slice(-30) });
  }
  const cutoff = Date.parse(now) - 90 * 864e5;
  const offers = [...map.values()].filter((o) => Date.parse(o.checkedAt) >= cutoff);
  return { offers, hist, added, changed };
}
