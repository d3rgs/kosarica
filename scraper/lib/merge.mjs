export const keyOf = (o) => [o.store, o.ean || o.sku || String(o.name).toLowerCase(), o.amount, o.unit].join("|");
// Nove ponudbe združi s prejšnjimi. Ničelnih ali neveljavnih cen ne sprejme, starih ne briše (po 90 dneh jih opusti).
export function mergeRun(prev, fresh, now = new Date().toISOString()) {
  const map = new Map((prev.offers || []).map((o) => [keyOf(o), o]));
  const hist = []; let added = 0, changed = 0;
  for (const o of fresh) {
    if (!(o.price > 0) || !o.store || !o.name) continue;
    const k = keyOf(o), p = map.get(k);
    if (!p) { added++; hist.push({ t: now, k, price: o.price, promo: o.promoPrice }); map.set(k, o); continue; }
    if (p.price !== o.price || p.promoPrice !== o.promoPrice || p.regularPrice !== o.regularPrice) {
      changed++; hist.push({ t: now, k, price: o.price, promo: o.promoPrice, prev: p.price });
    }
    map.set(k, { ...p, ...o });
  }
  const cutoff = Date.parse(now) - 90 * 864e5;
  const offers = [...map.values()].filter((o) => Date.parse(o.checkedAt) >= cutoff);
  return { offers, hist, added, changed };
}
