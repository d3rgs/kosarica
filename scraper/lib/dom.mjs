// Funkcije se izvajajo v brskalniku (page.evaluate) in v testih z jsdom. Ne smejo uporabljati spremenljivk zunaj telesa.
const T = (el, s) => { const e = el.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
export function extractSpar(doc = document) {
  const out = [], seen = new Set();
  doc.querySelectorAll("[data-product-sku]").forEach((el) => {
    const sku = el.getAttribute("data-product-sku");
    const q = (s) => el.querySelector(s), t = (s) => { const e = q(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
    if (!sku || seen.has(sku) || !q('[data-testid="card-base-price"]')) return;
    seen.add(sku);
    const a = q("a.containerCard"), img = q("img.prod__figure__img");
    out.push({ sku, name: (img && img.alt) || t('[data-testid="card-name"]'), url: a ? a.getAttribute("href") : "", img: img ? img.src : "",
      price: t('[data-testid="card-base-price"]'), pum: t(".prod__pum"), hist: t(".historic_price"), text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 400) });
  });
  return out;
}
export function extractMercator(doc = document) {
  const out = [], seen = new Set();
  doc.querySelectorAll("a.lib-product-name").forEach((a) => {
    let el = a;
    while (el && !(el.querySelector(".lib-product-price") && el.querySelector("img"))) el = el.parentElement;
    const href = a.getAttribute("href") || "";
    if (!el || seen.has(href)) return;
    seen.add(href);
    const t = (s) => { const e = el.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
    const img = el.querySelector("img");
    out.push({ name: a.getAttribute("title") || a.textContent.trim(), url: href, img: img ? (img.getAttribute("data-src") || img.getAttribute("src") || "") : "",
      price: t(".lib-product-price"), old: t(".lib-product-normal-price"), pum: t(".lib-product-price-per-unit-main"), pc30: t(".lib-product-pc30_price-value"),
      expires: t(".offer-expires-date"), text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 400) });
  });
  return out;
}
export function extractLidl(doc = document) {
  const out = [];
  doc.querySelectorAll(".product-grid-box").forEach((el) => {
    const ti = el.querySelector(".product-grid-box__title");
    if (!ti) return;
    const t = (s) => { const e = el.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
    const c = el.querySelector(".product-grid-box__content") || el, a = el.querySelector('a[href*="/p/"]'), img = el.querySelector("img");
    out.push({ title: ti.textContent.replace(/\s+/g, " ").trim(), price: t(".ods-price__value") || t(".ods-price__box-content"), stroke: t(".ods-price__stroke-price"),
      text: c.textContent.replace(/\s+/g, " ").trim(), url: a ? (a.getAttribute("href") || "").split("#")[0] : "", img: img ? img.getAttribute("src") || "" : "" });
  });
  return out;
}
