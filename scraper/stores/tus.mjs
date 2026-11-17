import { tusCands } from "../lib/cands.mjs";
// Tuš: javni WooCommerce Store API (JSON). Preberemo ves katalog po straneh (100 izdelkov na stran), iskanje trgovine ni zanesljivo.
const UA = "KosaricaAI-osebna-primerjava/1.0 (https://github.com/d3rgs/kosarica)";
const BASE = "https://www.tus.si/wp-json/wc/store/products?per_page=100";
export default {
  name: "Tuš",
  delay: 700,
  pages: async (foods) => {
    try {
      const r = await fetch(BASE + "&page=1", { headers: { accept: "application/json", "user-agent": UA } });
      const tp = Math.min(Math.max(+r.headers.get("x-wp-totalpages") || 1, 1), 80);
      return Array.from({ length: tp }, (_, i) => `${BASE}&page=${i + 1}`);
    } catch (e) {
      console.log("::warning::Tuš število strani: " + e.message);
      return [...new Set(foods.flatMap((f) => f.q.slice(0, 1)))].map((q) => `${BASE}&search=${encodeURIComponent(q.replace(/(\d),(\d)/g, "$1.$2"))}`);
    }
  },
  fetch: async (url) => {
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": UA } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { status: r.status, json: await r.json(), meta: [{ url: url.slice(0, 160), ct: "json", size: Number(r.headers.get("content-length")) || 0, head: "" }] };
  },
  cands: (scan) => tusCands(scan.json),
};
