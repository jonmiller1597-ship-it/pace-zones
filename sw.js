// Offline support: app files are cached on install; Google Fonts are cached the first time they load.
const CACHE = "pace-zones-v2";
const APP = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first for the app itself so updates show up; fall back to cache when offline.
// Same-origin requests skip the browser's HTTP cache (GitHub Pages lets it keep pages for
// 10 minutes), so a new deploy shows up on the next load instead of up to 10 minutes later.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const same = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    fetch(e.request, same ? { cache: "no-cache" } : undefined)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
