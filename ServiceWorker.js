const cacheName = "KorIsDeveloping-Rubato Notes-1.0-private-pwa";
const appShell = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "ServiceWorker.js",
  "TemplateData/style.css",
  "TemplateData/icons/apple-touch-icon.png",
  "TemplateData/icons/icon-192.png",
  "TemplateData/icons/icon-512.png",
  "Build/WebGLPrivatePwaGitHubPages.loader.js",
  "Build/WebGLPrivatePwaGitHubPages.framework.js.unityweb",
  "Build/WebGLPrivatePwaGitHubPages.data.unityweb",
  "Build/WebGLPrivatePwaGitHubPages.wasm.unityweb"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appShell);
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
        const cache = await caches.open(cacheName);
        cache.put("index.html", networkResponse.clone());
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
      const cache = await caches.open(cacheName);
      cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  })());
});
