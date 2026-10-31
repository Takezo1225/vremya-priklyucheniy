
const CACHE_NAME = "vremya-app-v4";
const VOICE_CACHE = "vremya-voice-audio-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./audio/hello.mp3",
  "./audio/lesson.mp3",
  "./audio/correct.mp3",
  "./audio/try_again.mp3",
  "./audio/reward.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key !== CACHE_NAME &&
            key !== VOICE_CACHE
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache =>
              cache.put("./index.html", copy)
            );
          }

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }

        return response;
      });
    })
  );
});
