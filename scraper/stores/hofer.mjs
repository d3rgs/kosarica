import { hoferCands } from "../lib/cands.mjs";
// Hoferjeva spletna ponudba: podatke kategorij strežnik vgradi v stran (__NUXT_DATA__), cene so v centih.
const cat = (slug, key) => `https://www.hofer.si/izdelki/${slug}/k/${key}`;
export default {
  name: "Hofer",
  pages: () => [
    cat("mleko-mlecni-izdelki-in-jajca", "1588161418378170"), cat("meso-mesni-izdelki-in-ribe", "1588161418378160"),
    cat("pekovski-izdelki-namazi-in-kosmici", "1588161418378180"), cat("zamrznjeni-izdelki", "1588161418378220"),
    cat("omake-olja-kis-in-zacimbe", "1588161418378200"), cat("konzervirana-hrana-in-pripravljeni-obroki", "1588161418378210"),
    cat("vse-za-peko", "1588161418378230"), cat("bio-izdelki", "1588161418378100"),
    cat("pregled-posebne-ponudbe", "1588161418378530"), cat("vse-spuscene-cene", "1588161418378360"),
  ],
  scan: {},
  cands: (scan) => hoferCands(scan.html),
};
