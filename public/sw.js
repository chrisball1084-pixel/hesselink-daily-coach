const CACHE_NAME = "hesselink-daily-coach-v1.0.0-beta.2";
const STATIC_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC_SHELL.map(scopedUrl));

  const indexUrl = scopedUrl("./index.html");
  const indexResponse = await cache.match(indexUrl);
  const html = await indexResponse.text();
  const discoveredAssets = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => new URL(match[1], indexUrl))
    .filter(
      (url) =>
        url.origin === self.location.origin &&
        url.pathname.startsWith(new URL(self.registration.scope).pathname),
    )
    .map((url) => url.href);

  await cache.addAll([...new Set(discoveredAssets)]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches.match(new URL("./index.html", self.registration.scope).href)
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
    )
  );
});
