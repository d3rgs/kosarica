import test from "node:test"; import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
// Test uporabniškega vmesnika: naloži pravi index.html in preveri prikaz cen, enot, zgodovine in slik.
const HTML = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const NOW = new Date().toISOString();
async function app(offers, stores = {}) {
  const prices = { generatedAt: NOW, stores, offers };
  const dom = new JSDOM(HTML, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://d3rgs.github.io/kosarica/",
    beforeParse(w) { w.matchMedia = () => ({ matches: true }); w.fetch = async () => ({ ok: true, json: async () => prices }); } });
  await new Promise((r) => setTimeout(r, 300));
  const w = dom.window;
  return { w, D: w.document, open: (name) => { w.show(w.eval(`S.f.find(x=>x.n==${JSON.stringify(name)}).id`)); return w.document.querySelector(".sh").textContent.replace(/\s+/g, " "); },
    pop: (name) => [...w.document.querySelectorAll(".it")].find((x) => x.title ? x.title === name : x.textContent.includes(name.split(" ")[0])).querySelector(".pop").textContent.replace(/\s+/g, " ") };
}
const o = (store, food, name, amount, unit, pack, price, extra = {}) => ({ store, food, name, amount, unit, pack, price, checkedAt: NOW, ...extra });

test("kakav in začimbe: cena pakiranja, primerjalna cena na 100 g; sadje na kg; mleko na l", async () => {
  const a = await app([
    o("SPAR", "Kakav", "KAKAV V PRAHU", 250, "g", "250 g", 5.73, { unitPrice: 22.92 }),
    o("Mercator", "Curry", "Curry", 40, "g", "40 g", 1.39),
    o("SPAR", "Banane", "BIO BANANE", 500, "g", "500 g", 0.75, { unitPrice: 1.49 }),
    o("SPAR", "Mleko 1,5 %", "MLEKO 6X1L", 6, "l", "6 × 1 l", 5.94),
    o("SPAR", "Tuna v lastnem soku (odcejena masa)", "TUNINA", 240, "g", "3 × 80 g", 3.29),
  ]);
  let t = a.open("Kakav"); assert.match(t, /5,73 €\s*250 g/); assert.match(t, /2,29 €\/100 g/); assert.ok(!/\/kg/.test(t));
  t = a.open("Curry"); assert.match(t, /1,39 €\s*40 g/); assert.match(t, /3,48 €\/100 g/);
  t = a.open("Banane"); assert.match(t, /0,75 €\s*500 g/); assert.match(t, /1,49 €\/kg/); assert.ok(!/100 g/.test(t));
  t = a.open("Mleko 1,5 %"); assert.match(t, /5,94 €\s*6 × 1 l/); assert.match(t, /0,99 €\/l/);
  t = a.open("Tuna v lastnem soku (odcejena masa)"); assert.match(t, /3,29 €\s*3 × 80 g/); assert.match(t, /1,37 €\/100 g/);
  assert.match(a.pop("Kakav"), /5,73 €250 g.*2,29 €\/100 g/);
});
test("brez zgodovine ni oznak REKORD in padec", async () => {
  const a = await app([o("SPAR", "Banane", "BANANE", 1, "kg", "1 kg", 1.49), o("Hofer", "Banane", "BANANE H", 1, "kg", "1 kg", 0.99)]);
  assert.ok(!/REKORD|padec/i.test(a.pop("Banane"))); a.D.querySelector("[data-v=a]").click();
  assert.ok(!/REKORD/.test(a.D.querySelector("#view").textContent.replace(/Rekord se prikaže[^.]*\./, "")));
});
test("rekord šele po 3 zapisih in 14 dneh; padec ob znižanju za 10 % ali več", async () => {
  const h = [{ d: day(-20), p: 1.49 }, { d: day(-10), p: 1.29 }, { d: day(-2), p: 0.99 }];
  const a = await app([o("SPAR", "Banane", "BANANE", 1, "kg", "1 kg", 0.99, { h, fs: day(-20) }),
    o("Hofer", "Skuta 0 %", "SKUTA", 1, "kg", "1 kg", 3.0, { h: [{ d: day(-3), p: 3.9 }, { d: day(-1), p: 3.0 }] })]);
  assert.match(a.pop("Banane"), /REKORD/); assert.match(a.pop("Skuta 0 %"), /padec −23 %/); assert.ok(!/REKORD/.test(a.pop("Skuta 0 %")));
});
test("slike: slika trgovine v podrobnostih in v hladilniku ob vklopu, z navedbo vira", async () => {
  const a = await app([o("SPAR", "Banane", "BANANE", 1, "kg", "1 kg", 1.49, { img: "https://cdn1.interspar.at/b.jpg", imgSource: "trgovina" }),
    o("Hofer", "Skuta 0 %", "SKUTA", 1, "kg", "1 kg", 3.0, { img: "https://images.openfoodfacts.org/s.jpg", imgSource: "off" })]);
  a.open("Banane"); assert.equal(a.D.querySelector(".wi").getAttribute("src"), "https://cdn1.interspar.at/b.jpg"); assert.match(a.D.querySelector(".sh").textContent, /Slika: spletna trgovina/);
  a.open("Skuta 0 %"); assert.match(a.D.querySelector(".sh").textContent, /Open Food Facts \(CC BY-SA\)/);
  a.w.tpic(); assert.ok(a.D.querySelector(".it img"));
});
test("Tuš in Eurospin v primerjavi, akcija z veljavnostjo, prihodnja ponudba ni aktualna", async () => {
  const a = await app([o("Tuš", "Mleko 1,5 %", "MLEKO", 1, "l", "1 l", 0.99), o("Eurospin", "Mleko 1,5 %", "POLPOSNETO MLEKO", 1, "l", "1 l", 0.69, { promoPrice: 0.69, regularPrice: 0.89, kind: "akcija", validFrom: day(-1), validTo: day(5) }),
    o("Lidl", "Mleko 1,5 %", "MLEKO LIDL", 1, "l", "1 l", 0.5, { validFrom: day(3), validTo: day(8) })]);
  const t = a.open("Mleko 1,5 %"); assert.match(t, /Tuš/); assert.match(t, /Eurospin/); assert.match(t, /Akcija velja do/); assert.match(t, /0,69 €\s*1 l/);
  assert.match(t, /velja od/);                                          // Lidlova ponudba se začne šele čez 3 dni
  assert.equal([...a.D.querySelectorAll(".chip")].filter((c) => /Tuš|Eurospin/.test(c.textContent)).length >= 2, true);
});
