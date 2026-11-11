import fs from "node:fs";
// 1) iskanje po spletni trgovini (hash-pot je ugibanje, poročilo probe pokaže, ali nalaga izdelke),
// 2) povezave do izdelkov iz config/mercator-urls.txt, 3) začetna stran.
const f = new URL("../config/mercator-urls.txt", import.meta.url);
export default {
  name: "Mercator",
  pages: (foods) => [
    ...(fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").map((s) => s.trim()).filter((s) => s.startsWith("http")) : []),
    ...foods.flatMap((x) => x.q.map((q) => `https://mercatoronline.si/brskaj#search=${encodeURIComponent(q)}`)),
    "https://mercatoronline.si/",
  ],
};
