const CACHE = "vremya-adventures-v4";

const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./audio/hello.mp3",
  "./audio/lesson.mp3",
  "./audio/correct.mp3",
  "./audio/try_again.mp3",
  "./audio/reward.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Для главной страницы сначала получаем свежую версию,
  // а без интернета открываем сохранённую.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => {
              cache.put("./index.html", copy);
            });
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // MP3 и остальные ресурсы сначала берём из офлайн-кэша.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then(cache => {
                cache.put(event.request, copy);
              });
            }
            return response;
          })
          .catch(() => Response.error());
      })
  );
});
