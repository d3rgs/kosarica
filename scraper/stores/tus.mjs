import { tusCands } from "../lib/cands.mjs";
// Tuš: javni WooCommerce Store API (JSON). Iskanje po živilih, do 100 zadetkov na iskanje.
const UA = "KosaricaAI-osebna-primerjava/1.0 (https://github.com/d3rgs/kosarica)";
export default {
  name: "Tuš",
  pages: (foods) => [...new Set(foods.flatMap((f) => f.q))].map((q) => `https://www.tus.si/wp-json/wc/store/products?per_page=100&search=${encodeURIComponent(q.replace(/(\d),(\d)/g, "$1.$2"))}`),
  fetch: async (url) => {
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": UA } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { status: r.status, json: await r.json(), meta: [{ url: url.slice(0, 160), ct: "json", size: Number(r.headers.get("content-length")) || 0, head: "" }] };
  },
  cands: (scan) => tusCands(scan.json),
};
