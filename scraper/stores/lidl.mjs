import { sitemapUrls, pickByFoods } from "../lib/sitemap.mjs";
// Lidl: javne kategorije in izdelki iz uradnega sitemapa. Cene živil so večinoma v tedenskih letakih (slike), ki jih ta modul ne bere.
export default {
  name: "Lidl",
  pages: async (foods) => {
    let more = [];
    try { more = pickByFoods(await sitemapUrls("https://www.lidl.si/p/export/SI/sl/product_sitemap.xml.gz"), foods, 25); }
    catch (e) { console.log("::warning::Lidl sitemap: " + e.message); }
    return ["https://www.lidl.si/h/sadje-in-zelenjava/h10071012", ...more];
  },
};
