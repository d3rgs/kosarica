import test from "node:test"; import assert from "node:assert/strict";
import { matchFood, toOffers } from "../lib/match.mjs";
import { lidlCands } from "../lib/cands.mjs";
import { parsePack } from "../lib/normalize.mjs";
import { cleanName } from "../lib/clean.mjs";
import { collect, finalize } from "../lib/pipeline.mjs";
import { FOODS, NONFOODS } from "../config/foods.mjs";
import hofer from "../stores/hofer.mjs";
const F = (name, packText) => matchFood({ name, packText }).food;
const NOW = "2026-11-16T05:00:00Z";

test("skuta 0 %: 10 % in 40 % m.m. nista skuta 0 %", () => {
  assert.equal(F("Pasirana skuta, 10 % m.m., Active Zone, 500 g"), null);
  assert.equal(F("Nepasirana skuta, 40 % m.m., Zelene Doline, 500 g"), null);
  assert.equal(F("NEPASIRANA PUSTA SKUTA, SPAR, 500G"), "Skuta 0 %");
  assert.equal(F("Skuta 0 % m.m., Mu, 250 g"), "Skuta 0 %");
});
test("kakav: kakav v prahu da, pecivo s kakavom ne", () => {
  assert.equal(F("Kakav v prahu, Gorenjka, 100 g"), "Kakav");
  assert.equal(F("BIO PRESNI KAKAV CRIOLLO V PRAHU, UHTCO, 200G"), "Kakav");
  for (const n of ["ROGLJIČEK LEŠNIK IN KAKAV, 70 g", "PENICE S KAKAVOVIM PRELIVOM, 100 g", "REZINE FARCITÌ S KAKAVOVO KREMO, 10 KOSOV"]) assert.equal(F(n), null, n);
});
test("fino mleta sol, tuna, jajca", () => {
  assert.equal(F("SOL FINA JODIRANA, 1KG"), "Fino mleta sol"); assert.equal(F("Morska sol, groba, 1 kg"), null);
  assert.equal(F("TUNINA V LASTNEM SOKU, DESPAR, 3X80G"), "Tuna v lastnem soku (odcejena masa)");
});
test("Lidl: jajca s številom kosov dobijo pravo količino, kg-izdelki cene na kg", () => {
  const c = lidlCands([
    { title: "Sveža jajca izpod kamniških planin", price: "2.99€*", stroke: "", text: "Sveža jajca izpod kamniških planin 2.99€* 10 kos 1 kos = 0,30 Od 16.11. do 22.11.", url: "/p/jajca/p1" },
    { title: "Limone", price: "0.89€*", stroke: "1.29 €", text: "Limone 1.29 € -31% 0.89€* 500 g 1 kg = 1,78 Od 23.11. do 28.11.", url: "/p/limone/p2" },
    { title: "Rdeča jabolka", price: "1.29€*", stroke: "1.99 €", text: "Rdeča jabolka 1.99 € -35% 1.29€* za kg Od 16.11. do 18.11.", url: "/p/j/p3" }], new Date(NOW));
  assert.equal(c[0].packText, "10 kos"); assert.equal(c[0].unitPrice, undefined);
  const { o } = { o: toOffers("Lidl", "https://www.lidl.si/", c, {}, NOW, {}) };
  const e = o.find((x) => x.food === "Jajca"); assert.equal(e.amount, 10); assert.equal(e.unit, "kos"); assert.equal(e.price, 2.99);
});
test("območja cen: banana 3,60 €/kg (Hofer »banana ali«) in kaki 0,34 €/kg se zavrnejo", () => {
  const st = {};
  const o = toOffers("Hofer", "https://x.si/", [{ name: "banana ali", price: 0.63, packText: "175 g" }, { name: "KAKI POREKLO SLOVENIJA, 1KG", price: 0.34 }, { name: "BANANE, 1KG", price: 1.49 }], {}, NOW, st);
  assert.equal(o.length, 1); assert.equal(o[0].price, 1.49); assert.ok(st.rejected.some((r) => /izven razpona/.test(r)));
});
test("zapisi iz starih različic (V KOŠARICO, Potrdi) se počistijo in ne podvajajo", () => {
  assert.equal(cleanName("V KOŠARICO Pasirana skuta, 10 % m.m."), "Pasirana skuta, 10 % m.m."); assert.equal(cleanName("Potrdi KAKAV V PRAHU CHEF, GORENJKA, 100G"), "KAKAV V PRAHU CHEF, GORENJKA, 100G");
  const old = { store: "SPAR", food: "Kakav", name: "Potrdi KAKAV V PRAHU CHEF, GORENJKA, 100G", amount: 100, unit: "g", price: 2.29, checkedAt: "2026-11-15T05:00:00Z" };
  const fresh = [{ store: "SPAR", food: "Kakav", sku: "55", name: "KAKAV V PRAHU CHEF, GORENJKA, 100G", amount: 100, unit: "g", price: 2.29, checkedAt: NOW }];
  const m = finalize({ offers: [old] }, fresh, NOW); assert.equal(m.offers.length, 1); assert.equal(m.offers[0].sku, "55");
});
test("neživila: ujemanja po tipičnih imenih (preveriti po prvem zagonu na pravih podatkih)", () => {
  const ok = { "TOALETNI PAPIR 3-SLOJNI, S-BUDGET, 8/1": "Toaletni papir", "PRALNI PRAŠEK UNIVERZALNI, PERSIL, 2,6KG": "Pralni prašek", "ŠAMPON ZA LASE, SCHAUMA, 250ML": "Šampon",
    "ALU FOLIJA, 30 M x 29 CM": "Aluminijasta folija", "VREČKE ZA SMETI 35 L, 30/1": "Vrečke za smeti", "TABLETE ZA POMIVALNI STROJ, FINISH, 50/1": "Tablete za pomivalni stroj", "ZOBNA PASTA, COLGATE, 75ML": "Zobna pasta" };
  for (const [n, f] of Object.entries(ok)) assert.equal(F(n), f, n);
  assert.equal(F("ŠAMPON ZA PSE, 250ML"), null); assert.equal(F("Mleko 1,5 % 1 l"), "Mleko 1,5 %"); assert.equal(F("ČISTILO ZA POMIVALNI STROJ, 250ML"), null);
  assert.deepEqual(parsePack("TOALETNI PAPIR 8 ROL"), { amount: 8, unit: "kos", label: "8 kos" });
  assert.ok(NONFOODS.length >= 12 && NONFOODS.every((x) => x.nf && x.grp && x.q.length));
  assert.ok(FOODS.filter((x) => !x.nf).length === 20);
});
test("Hofer: količina, ki manjka v kategoriji, se prebere s strani izdelka", async () => {
  const listProduct = { sku: "676958", name: "Trajno mleko brez zamaška, 1,5%", brandName: "No Brand", urlSlugText: "no-brand-trajno-mleko", sellingSize: null, price: { amount: 79, comparisonDisplay: null } };
  const detail = { ...listProduct, sellingSize: "1 l", price: { amount: 79, comparisonDisplay: "0,79 €/1 l" } };
  const nuxt = (p) => {
    const arr = [], add = (v) => { if (v && typeof v === "object") { const i = arr.length; arr.push(null); arr[i] = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === null ? null : add(x)])); return i; } arr.push(v); return arr.length - 1; };
    add(p); return `<script type="application/json" id="__NUXT_DATA__">${JSON.stringify(arr)}</script>`;
  };
  const scan = async (url) => ({ html: nuxt(url.includes("/izdelek/") ? detail : listProduct) });
  const mod = { ...hofer, pages: () => ["https://www.hofer.si/izdelki/mleko/k/1"] };
  const { fresh } = await collect({ stores: [mod], scan, foods: FOODS, now: NOW });
  assert.equal(fresh.length, 1); assert.equal(fresh[0].food, "Mleko 1,5 %"); assert.equal(fresh[0].amount, 1); assert.equal(fresh[0].unit, "l"); assert.ok(Math.abs(fresh[0].unitPrice - 0.79) < 1e-9);
});

test("časovna omejitev: po izteku roka se nove strani ne odpirajo, zbrani podatki ostanejo", async () => {
  let opened = 0;
  const mod = { name: "SPAR", pages: () => ["a", "b", "c"], scan: {}, cands: () => [], };
  const r = await collect({ stores: [mod], scan: async () => { opened++; return {}; }, foods: FOODS, now: NOW, deadline: Date.now() - 1 });
  assert.equal(opened, 0); assert.match(r.status.SPAR.errors.join(" "), /časovna omejitev/);
  const r2 = await collect({ stores: [mod, { ...mod, name: "Hofer" }], scan: async () => ({}), foods: FOODS, now: NOW });
  assert.deepEqual(Object.keys(r2.status).sort(), ["Hofer", "SPAR"]);            // trgovine tečejo vzporedno, vsaka ima svoje stanje
});

test("Lidl: količina iz primerjalne cene »1 kg = 5,70«", () => {
  const c = lidlCands([{ title: "Sveže mleto mešano meso", price: "2.85€*", stroke: "", text: "Sveže mleto mešano meso 2.85€* 1 kg = 5,70 Od 16.11. do 18.11.", url: "/p/m/p9" }], new Date(NOW));
  assert.equal(c[0].unitPrice.value, 5.7); assert.equal(c[0].unitPrice.unit, "kg");
  const o = toOffers("Lidl", "https://www.lidl.si/", c, {}, NOW, {}).find((x) => x.food === "Drugo mleto meso");
  assert.ok(o); assert.equal(o.amount, 0.5); assert.equal(o.unit, "kg");
});
test("kumara »1 kos« s ceno na kg: teža se izračuna iz primerjalne cene", () => {
  const st = {}, o = toOffers("SPAR", "https://online.spar.si/", [{ name: "BIO KUMARA DOLGA, TEHTANO, 1KOS", price: 1.1, unitPrice: { value: 2.2, unit: "kg" } }], {}, NOW, st);
  assert.equal(o.length, 1, JSON.stringify(st.rejected)); assert.equal(o[0].unit, "kg"); assert.equal(o[0].amount, 0.5); assert.match(o[0].pack, /1 kos \(≈ 0,5 kg\)/);
});
test("podvojeni zapisi iste ponudbe pod različnimi ID-ji se združijo", () => {
  const mk = (sku) => ({ store: "Tuš", food: "Pralni prašek", sku, name: "Pralni prašek Persil, 3,465 kg", amount: 3.465, unit: "kg", price: 19.19, checkedAt: NOW });
  assert.equal(finalize({ offers: [] }, [mk("1"), mk("2")], NOW).offers.length, 1);
});
test("Hofer: več kategorij in količina iz besedila strani izdelka", async () => {
  assert.ok(hofer.pages().length >= 16); assert.ok(hofer.pages().some((u) => /sadje-in-zelenjava/.test(u)) && hofer.pages().some((u) => /cistila/.test(u)));
  const listProduct = { sku: "676958", name: "Trajno mleko brez zamaška, 1,5%", brandName: "No Brand", urlSlugText: "no-brand-trajno-mleko", sellingSize: null, price: { amount: 79, comparisonDisplay: null } };
  const arr = []; const add = (v) => { if (v && typeof v === "object") { const i = arr.length; arr.push(null); arr[i] = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === null ? null : add(x)])); return i; } arr.push(v); return arr.length - 1; }; add(listProduct);
  const html = `<script type="application/json" id="__NUXT_DATA__">${JSON.stringify(arr)}</script>`;
  const scan = async (url) => (url.includes("/izdelek/") ? { html: "<html></html>", text: "Trajno mleko\n0,79 €vključen DDV\nTO NI AKCIJA\nPodrobnosti o izdelku\n1 l\nPonudba vsebuje izdelke" } : { html });
  const mod = { ...hofer, pages: () => ["https://www.hofer.si/izdelki/mleko/k/1"] };
  const { fresh } = await collect({ stores: [mod], scan, foods: FOODS, now: NOW });
  assert.equal(fresh.length, 1); assert.equal(fresh[0].amount, 1); assert.equal(fresh[0].unit, "l");
});

test("Tuš: manjkajoča slika se prebere iz og:image strani izdelka, logotip se ne uporabi", async () => {
  const tus = (await import("../stores/tus.mjs")).default;
  const real = globalThis.fetch; const pages = { "https://www.tus.si/a/": '<meta property="og:image" content="https://www.tus.si/wp-content/uploads/pralni.jpg">', "https://www.tus.si/b/": '<meta property="og:image" content="https://www.tus.si/wp-content/uploads/logo.png">' };
  globalThis.fetch = async (u) => ({ ok: true, text: async () => pages[u] });
  try {
    const c = await tus.enrich([{ name: "Pralni prašek Persil, 3,465 kg", url: "https://www.tus.si/a/" }, { name: "Pralni prašek Ariel, 2 kg", url: "https://www.tus.si/b/" }]);
    assert.equal(c[0].img, "https://www.tus.si/wp-content/uploads/pralni.jpg"); assert.equal(c[1].img, undefined);
  } finally { globalThis.fetch = real; }
});
