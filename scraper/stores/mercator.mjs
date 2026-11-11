import fs from "node:fs";
// Povezave do izdelkov (en URL na vrstico) so v config/mercator-urls.txt; dodaj povezave do strani izdelkov
// z mercatoronline.si. Poleg njih se pregleda še začetna stran.
const f = new URL("../config/mercator-urls.txt", import.meta.url);
export default {
  name: "Mercator",
  pages: () => [
    ...(fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").map((s) => s.trim()).filter((s) => s.startsWith("http")) : []),
    "https://mercatoronline.si/",
  ],
};
