const U = { g: ["kg", 0.001], kg: ["kg", 1], ml: ["l", 0.001], l: ["l", 1], kos: ["kos", 1] };
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
export function parsePack(t) {
  const s = String(t ?? "").toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ");
  let m = s.match(/(\d+)\s?[x×]\s?(\d+(?:\.\d+)?)\s?(kg|g|ml|cl|dl|l|kos)\b/), n, u;
  if (m) { n = +m[1] * parseFloat(m[2]); u = m[3]; }
  else {
    m = s.match(/(\d+(?:\.\d+)?)\s?(kg|g|ml|cl|dl|l|kos|jajc\w*)\b/);
    if (!m) return null;
    n = parseFloat(m[1]); u = m[2].startsWith("jajc") ? "kos" : m[2];
  }
  if (u === "cl") return { amount: +(n * 10).toFixed(4), unit: "ml" };
  if (u === "dl") return { amount: +(n * 100).toFixed(4), unit: "ml" };
  return { amount: +n.toFixed(4), unit: u };
}
export const family = (u) => U[u]?.[0] ?? null;
export const unitPrice = (price, amount, unit) => (U[unit] ? price / (amount * U[unit][1]) : NaN);
