import zlib from "node:zlib";
import { fromJsonLd } from "./harvest.mjs";
const UA = "KosaricaAI-osebna-primerjava/1.0 (https://github.com/d3rgs/kosarica)";
// Diagnostika Lidla po korakih: dostopnost sitemapa, veljavnost stisnjenega XML, povezave, cene na straneh izdelkov.
export async function diagnoseLidl({ fetch = globalThis.fetch, scan, foods = [], max = 10 } = {}) {
  const rep = { store: "Lidl-diagnostika", koraki: {} }, url = "https://www.lidl.si/p/export/SI/sl/product_sitemap.xml.gz";
  let r;
  try { r = await fetch(url, { headers: { "user-agent": UA } }); } catch (e) { rep.koraki["1 dostopnost"] = { ok: false, napaka: String(e.message || e) }; return rep; }
  rep.koraki["1 dostopnost"] = { ok: r.ok, status: r.status, contentType: r.headers.get("content-type") };
  const buf = Buffer.from(await r.arrayBuffer()), gz = buf[0] === 0x1f && buf[1] === 0x8b;
  let xml = "";
  try { xml = (gz ? zlib.gunzipSync(buf) : buf).toString("utf8"); } catch (e) { rep.koraki["3 veljavna stisnjena XML datoteka"] = { ok: false, napaka: e.message }; return rep; }
  rep.koraki["3 veljavna stisnjena XML datoteka"] = { ok: /<urlset|<sitemapindex/.test(xml), bajtov: buf.length, gzip: gz, sitemapIndex: /<sitemapindex/.test(xml) };
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  rep.koraki["4 povezave"] = { skupaj: locs.length, primeri: locs.slice(0, 3) };
  const slug = (u) => { try { return decodeURIComponent(u.split("/").slice(-2).join(" ")).replace(/[-_]+/g, " "); } catch { return u; } };
  const food = locs.filter((u) => foods.some((f) => f.inc.test(slug(u)) && !(f.exc && f.exc.test(slug(u)))));
  rep.koraki["4 povezave"].zaZivilaIzSeznama = food.length;
  const pick = [...food.slice(0, max), ...locs.slice(0, 3)].slice(0, max + 3), pages = [];
  const tot = { strani: 0, jsonLdCena: 0, cenaVHtml: 0, domCena: 0, brezCene: 0 };
  for (const u of pick) {
    if (!scan) break;
    const p = { url: u.slice(0, 120) };
    try {
      const s = await scan(u, {}), html = s.html || "";
      p.status = s.status; p.jsonLdCena = fromJsonLd(html).length; p.cenaVHtml = /\d[.,]\d{2}\s?(€|EUR)|"price"\s*:\s*[\d.]+/.test(html); p.domCena = /ods-price__value|ods-price__box-content/.test(html); p.ean = /"eans"/.test(html);
      tot.strani++; if (p.jsonLdCena) tot.jsonLdCena++; if (p.cenaVHtml) tot.cenaVHtml++; if (p.domCena) tot.domCena++; if (!p.jsonLdCena && !p.cenaVHtml && !p.domCena) tot.brezCene++;
    } catch (e) { p.napaka = String(e.message || e).slice(0, 100); }
    pages.push(p);
  }
  rep.koraki["5-6 cene na straneh izdelkov"] = { ...tot, strani_primeri: pages };
  return rep;
}
