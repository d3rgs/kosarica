import { eurospinCands } from "../lib/cands.mjs";
// Eurospin: stran »Akcija« je strežniško izrisana in vsebuje tedenske akcijske izdelke (redna in akcijska cena, količina, veljavnost).
export default {
  name: "Eurospin",
  pages: () => ["https://www.eurospin.si/akcije/"],
  scan: { scroll: true, wait: 3000 },
  cands: (scan) => eurospinCands(scan.text),
};
