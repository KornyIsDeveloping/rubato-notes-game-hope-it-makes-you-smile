const cacheName = "KorIsDeveloping-Rubato Notes-1.0-private-pwa-v2";
const appShell = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "ServiceWorker.js",
  "TemplateData/style.css",
  "TemplateData/icons/apple-touch-icon.png",
  "TemplateData/icons/icon-192.png",
  "TemplateData/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(cacheName);
      await cache.addAll(appShell);
    } catch (error) {
      console.warn("Service worker pre-cache failed.", error);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== cacheName)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET")
    return;

  event.respondWith((async () => {
    if (event.request.mode === "navigate") {
      try {
        const networkResponse = await fetch(event.request);
        try {
          const cache = await caches.open(cacheName);
          await cache.put("index.html", networkResponse.clone());
        } catch (error) {
          console.warn("Navigation cache update failed.", error);
        }
        return networkResponse;
      } catch (error) {
        const cachedNavigation = await caches.match("index.html");
        if (cachedNavigation)
          return cachedNavigation;
      }
    }

    const cachedResponse = await caches.match(event.request);
    if (cachedResponse)
      return cachedResponse;

    const networkResponse = await fetch(event.request);
    const requestUrl = new URL(event.request.url);
    if (networkResponse.ok && requestUrl.origin === self.location.origin) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(event.request, networkResponse.clone());
      } catch (error) {
        console.warn("Runtime cache write failed.", error);
      }
    }
    return networkResponse;
  })());
});
