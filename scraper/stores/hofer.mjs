import { sitemapUrls, pickByFoods } from "../lib/sitemap.mjs";
// Hoferjeve kategorije (strežniško izrisane) in izdelki iz sitemapa, filtrirani po imenih živil.
export default {
  name: "Hofer",
  pages: async (foods) => {
    let more = [];
    try { more = pickByFoods(await sitemapUrls("https://www.hofer.si/sitemap_products.xml"), foods, 25); }
    catch (e) { console.log("::warning::Hofer sitemap: " + e.message); }
    return [
      "https://www.hofer.si/izdelki/mleko-mlecni-izdelki-in-jajca/k/1588161418378170",
      "https://www.hofer.si/izdelki/meso-mesni-izdelki-in-ribe/k/1588161418378160",
      "https://www.hofer.si/izdelki/pekovski-izdelki-namazi-in-kosmici/k/1588161418378180",
      "https://www.hofer.si/izdelki/zamrznjeni-izdelki/k/1588161418378220",
      ...more,
    ];
  },
};
