const U = { g: ["kg", 0.001], kg: ["kg", 1], ml: ["l", 0.001], cl: ["l", 0.01], dl: ["l", 0.1], l: ["l", 1], kos: ["kos", 1], cm: ["m", 0.01], m: ["m", 1] };
export const toNum = (s) => {
  if (typeof s === "number") return s;
  const m = String(s ?? "").replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : NaN;
};
export function parsePrice(t) {
  const s = String(t ?? "");
  const m = s.match(/(\d{1,5}(?:[.,]\d{1,2})?)\s?(?:€|eur)/i) || s.match(/(?:€|eur)\s?(\d{1,5}(?:[.,]\d{1,2})?)/i);
  return m ? parseFloat(m[1].replace(",", ".")) : NaN;
}
const UN = "kg|g|ml|cl|dl|l|kos|cm|m";
const fmt = (n) => String(+n.toFixed(3)).replace(".", ",");
// Vrne skupno količino v osnovni enoti pakiranja (g, kg, ml, l, kos, m), večpakiranja (6 x 0,5 l) so že pomnožena.
export function parsePack(t) {
  const s = String(t ?? "").toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ");
  let m = s.match(new RegExp(`(\\d+)\\s?[x×]\\s?(\\d+(?:\\.\\d+)?)\\s?(${UN})\\b`)), n, u, label;
  if (m) { n = +m[1] * parseFloat(m[2]); u = m[3]; label = `${m[1]} × ${fmt(parseFloat(m[2]))} ${u}`; }
  else {
    m = s.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s?(${UN}|jajc\\w*)(?![\\w.])`));
    if (!m) return null;
    n = parseFloat(m[1]); u = m[2].startsWith("jajc") ? "kos" : m[2]; label = `${fmt(n)} ${u}`;
  }
  if (u === "cl") return { amount: +(n * 10).toFixed(4), unit: "ml", label };
  if (u === "dl") return { amount: +(n * 100).toFixed(4), unit: "ml", label };
  return { amount: +n.toFixed(4), unit: u, label };
}
export const family = (u) => U[u]?.[0] ?? null;
// Primerjalna cena vedno v €/kg, €/l, €/kos ali €/m. Zaokroževanje šele ob prikazu.
export const unitPrice = (price, amount, unit) => (U[unit] ? price / (amount * U[unit][1]) : NaN);
// "0,89 €/100 g" -> { value: 8.9, unit: "kg" }, "1,49 € za 500 g" -> { value: 2.98, unit: "kg" }
export function normalizeUnitPrice(text) {
  const s = String(text ?? "").toLowerCase().replace(/,/g, ".");
  const m = s.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s?(?:€|eur)\\s?(?:\\/|na|za)\\s?(\\d+(?:\\.\\d+)?)?\\s?(${UN})\\b`));
  if (!m) return null;
  const f = U[m[3]], per = m[2] ? parseFloat(m[2]) : 1;
  return { value: parseFloat(m[1]) / (per * f[1]), unit: f[0] };
}
