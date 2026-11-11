// Iskanje po spletni trgovini; podatke zajame iz odgovorov, ki jih stran naloži sama (JSON ali RSC).
export default {
  name: "SPAR",
  pages: (foods) => [...new Set(foods.flatMap((f) => f.q.map((q) => `https://online.spar.si/search?name=${encodeURIComponent(q)}`)))],
};
