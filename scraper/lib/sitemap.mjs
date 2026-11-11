import zlib from "node:zlib";
// Prebere sitemap (tudi .gz) in vrne naslove. Ob napaki vrže izjemo, klicatelj jo ujame.
export async function sitemapUrls(url, limit = 50000) {
  const r = await fetch(url, { headers: { "user-agent": "KosaricaAI-osebna-primerjava/1.0" } });
  if (!r.ok) throw new Error("sitemap HTTP " + r.status);
  let buf = Buffer.from(await r.arrayBuffer());
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
  return [...buf.toString("utf8").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).slice(0, limit);
}
export function pickByFoods(urls, foods, max = 30) {
  const out = [];
  for (const u of urls) {
    let slug = u; try { slug = decodeURIComponent(u.split("/").slice(-2).join(" ")); } catch {}
    slug = slug.replace(/[-_]+/g, " ");
    if (foods.some((f) => f.inc.test(slug) && !(f.exc && f.exc.test(slug)))) { out.push(u); if (out.length >= max) break; }
  }
  return out;
}
