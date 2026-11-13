// Odpre stran v Playwrightu in zbere HTML, besedilo ter JSON in RSC odgovore, ki jih stran naloži sama.
// Ne obide CAPTCHA ali zaščit: če stran blokira, vrne napako.
export async function scanPage(browser, url, { wait = 2500, scroll = true, evaluate, waitFor } = {}) {
  const ctx = await browser.newContext({ locale: "sl-SI" });
  const page = await ctx.newPage();
  const jsons = [], rscs = [], meta = [];
  page.on("response", async (r) => {
    try {
      if (!r.ok()) return;
      const ct = r.headers()["content-type"] || "";
      if (ct.includes("json")) { const t = await r.text(); meta.push({ url: r.url().slice(0, 200), ct: "json", size: t.length, head: t.slice(0, 350) }); jsons.push(JSON.parse(t)); }
      else if (ct.includes("text/x-component")) { const t = await r.text(); meta.push({ url: r.url().slice(0, 200), ct: "rsc", size: t.length, head: t.slice(0, 350) }); rscs.push(t); }
    } catch {}
  });
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const status = resp?.status() ?? 0;
    if (status >= 400) throw new Error("HTTP " + status);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(wait);
    if (scroll) for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(600); }
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);
    const dom = evaluate ? await page.evaluate(evaluate) : undefined;
    const shot = await page.screenshot();
    return { url, status, html, text, jsons, rscs, dom, meta: meta.slice(0, 20), shot };
  } finally { await ctx.close(); }
}
