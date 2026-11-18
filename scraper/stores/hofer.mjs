import { hoferCands, hoferToCand } from "../lib/cands.mjs";
import { hoferProducts } from "../lib/nuxt.mjs";
import { matchFood } from "../lib/match.mjs";
import { parsePack } from "../lib/normalize.mjs";
// Hoferjeva spletna ponudba: podatke kategorij strežnik vgradi v stran (__NUXT_DATA__), cene so v centih.
// Pri izdelkih iz seznama, ki v kategoriji nimajo količine, jo poskusimo prebrati s strani izdelka (največ 15 strani).
const cat = (slug, key) => `https://www.hofer.si/izdelki/${slug}/k/${key}`;
export default {
  name: "Hofer",
  pages: () => [
    cat("mleko-mlecni-izdelki-in-jajca", "1588161418378170"), cat("meso-mesni-izdelki-in-ribe", "1588161418378160"),
    cat("pekovski-izdelki-namazi-in-kosmici", "1588161418378180"), cat("zamrznjeni-izdelki", "1588161418378220"),
    cat("omake-olja-kis-in-zacimbe", "1588161418378200"), cat("konzervirana-hrana-in-pripravljeni-obroki", "1588161418378210"),
    cat("vse-za-peko", "1588161418378230"), cat("bio-izdelki", "1588161418378100"),
    cat("pregled-posebne-ponudbe", "1588161418378530"), cat("vse-spuscene-cene", "1588161418378360"),
    cat("sadje-in-zelenjava", "1588161418378150"), cat("testenine-riz-in-strocnice", "1588161418378190"), cat("kakovost-iz-slovenije", "1588161418378130"),
    cat("osebna-nega", "1588161418378280"), cat("izdelki-za-dom-in-gospodinjstvo", "1588161418378270"), cat("cistila", "1588161418378520"),
  ],
  scan: {},
  cands: (scan) => hoferCands(scan.html),
  enrich: async (cands, { scan }) => {
    let n = 0;
    for (const c of cands) {
      if (c.packText || c.unitPrice || n >= 15 || !c.url || !matchFood(c).food) continue;
      n++;
      try {
        const s = await scan(c.url, { wait: 1500, scroll: false });
        const p = hoferProducts(s.html).find((x) => String(x.sku) === String(c.sku));
        if (p) { const d = hoferToCand(p); if (d.packText) c.packText = d.packText; if (d.unitPrice) c.unitPrice = d.unitPrice; if (d.unitText) c.unitText = d.unitText; }
        if (!c.packText) {                                                    // stran izdelka: »Podrobnosti o izdelku« in pod tem količina (npr. 1 l)
          const lines = String(s.text || "").split("\n").map((x) => x.trim()).filter(Boolean), i = lines.findIndex((x) => /^Podrobnosti o izdelku/i.test(x));
          const pk = i >= 0 ? lines.slice(i + 1, i + 4).find((x) => x.length < 30 && parsePack(x)) : null;
          if (pk) c.packText = pk;
        }
      } catch {}
    }
    return cands;
  },
};
