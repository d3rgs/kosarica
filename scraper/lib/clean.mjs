// Odstrani besedilo uporabniškega vmesnika, ki se je prilepilo k imenom izdelkov (Dodaj, Ni na voljo, Razvrsti po, Rezultati za ...).
const UI = /^(?:dodaj v košarico|dodaj|ni na voljo|razvrsti po:?|rezultati za\s*[„“"”'].*?[“”"'])\s*/i;
export function cleanName(s) {
  let t = String(s ?? "").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 5; i++) { const u = t.replace(UI, "").trim(); if (u === t) break; t = u; }
  return t.replace(/\b(BIO)(\s+\1\b)+/gi, "$1").replace(/\.{2,}|…/g, "").trim();
}
// Ime izdelka brez znamke in okusa: del pred prvo vejico, ki ni decimalna (1,5 %).
export const productPart = (s) => String(s ?? "").split(/,(?!\d)/)[0].trim();
