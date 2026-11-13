// Nuxt 3 shrani podatke strani v <script id="__NUXT_DATA__"> kot tabelo, kjer števila pomenijo indekse (devalue).
export function nuxtArray(html) {
  const m = String(html).match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}
export function resolve(arr, i, d = 0) {
  if (d > 8) return null;
  const v = arr[i];
  if (Array.isArray(v)) {
    if (v.length === 2 && typeof v[0] === "string" && ["Reactive", "ShallowReactive", "Ref", "shallowRef"].includes(v[0])) return resolve(arr, v[1], d + 1);
    return v.map((x) => (Number.isInteger(x) && x >= 0 ? resolve(arr, x, d + 1) : x));
  }
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = Number.isInteger(x) && x >= 0 ? resolve(arr, x, d + 1) : x; return o; }
  return v;
}
export function hoferProducts(html) {
  const arr = nuxtArray(html); if (!arr) return [];
  const out = [], seen = new Set();
  arr.forEach((v, idx) => {
    if (v && typeof v === "object" && !Array.isArray(v) && "sku" in v && "sellingSize" in v && "price" in v) {
      const p = resolve(arr, idx);
      if (p && p.sku && !seen.has(p.sku)) { seen.add(p.sku); out.push(p); }
    }
  });
  return out;
}
