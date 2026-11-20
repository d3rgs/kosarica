import { walk } from "./harvest.mjs";
const UA = "KosaricaAI-osebna-primerjava/1.0 (https://github.com/d3rgs/kosarica)";
export const OVERVIEW = "https://esi.leaflets.schwarz/overview?client_locale=lidl/sl-SI";
export const flyerUrl = (id) => `https://endpoints.leaflets.schwarz/v4/flyer?flyer_identifier=${encodeURIComponent(id)}&region_id=0&region_code=0`;
// Identifikatorje letakov poiščemo v pregledu (HTML odlomek); oblika ni dokumentirana, zato več vzorcev.
export function flyerIds(html) {
  const ids = new Set();
  for (const m of String(html).matchAll(/flyer[_-]?identifier["'=:\s]+["']?([A-Za-z0-9_-]{6,})/gi)) ids.add(m[1]);
  for (const m of String(html).matchAll(/\/letaki\/([A-Za-z0-9_-]{6,})\/view/gi)) ids.add(m[1]);
  for (const m of String(html).matchAll(/\/v4\/flyer\?flyer_identifier=([A-Za-z0-9_-]+)/gi)) ids.add(m[1]);
  return [...ids];
}
// Izdelki iz JSON letaka: objekti z naslovom in povezavo do strani izdelka (/p/...), brez cen (cene so na straneh izdelkov).
export function flyerProducts(json) {
  const out = new Map();
  walk(json, (o) => {
    const url = [o.url, o.link, o.href, o.productUrl].find((u) => typeof u === "string" && /lidl\.si\/p\//.test(u));
    const title = [o.title, o.name, o.productName].find((t) => typeof t === "string" && t.length > 2);
    if (url && title && !out.has(url)) out.set(url, { title, url, price: typeof o.price === "number" ? o.price : undefined });
  });
  return [...out.values()];
}
export async function discoverFlyerProducts(fetch = globalThis.fetch, max = 3) {
  const rep = { overview: null, flyers: [], products: [] };
  const get = async (u, json) => { const r = await fetch(u, { headers: { "user-agent": UA, accept: json ? "application/json" : "text/html" } }); return { status: r.status, ok: r.ok, body: json ? await r.json() : await r.text() }; };
  const o = await get(OVERVIEW, false); rep.overview = { status: o.status, bytes: String(o.body).length };
  const ids = flyerIds(o.body).slice(0, max); rep.flyers = ids;
  for (const id of ids) { try { const f = await get(flyerUrl(id), true); rep.products.push(...flyerProducts(f.body)); } catch (e) { rep.flyers.push("napaka " + id + ": " + e.message); } }
  return rep;
}
