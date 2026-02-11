
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Estratégia simples de Network First para garantir dados da Yara sempre frescos
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
