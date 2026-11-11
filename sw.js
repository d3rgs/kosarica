const C = "kosarica-v2", A = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(C).then((c) => c.addAll(A)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith("prices.json")) { // cene: najprej omrežje, brez povezave zadnja shranjena različica
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(C).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  if (e.request.mode === "navigate" || u.pathname.endsWith("index.html")) { // stran aplikacije: vedno najnovejša, brez povezave predpomnilnik
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(C).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then((r) => { // lupina aplikacije: iz predpomnilnika, v ozadju posodobi
    const f = fetch(e.request).then((n) => { const c = n.clone(); caches.open(C).then((x) => x.put(e.request, c)); return n; }).catch(() => r);
    return r || f;
  }));
});
