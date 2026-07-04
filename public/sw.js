const CACHE_NAME = "studivo-v2";
const ASSETS_TO_CACHE = [
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

const isNextAssetRequest = (request) => new URL(request.url).pathname.startsWith("/_next/");
const isNavigationRequest = (request) => request.mode === "navigate";

// Install event - cache only stable public assets. Do not precache HTML or Next.js chunks.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some assets fail to cache.
      });
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - keep HTML/RSC and Next.js build assets network-owned to avoid stale chunks after deploy.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (isNavigationRequest(event.request) || isNextAssetRequest(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        const requestUrl = new URL(event.request.url);
        const shouldCache =
          requestUrl.origin === self.location.origin &&
          ASSETS_TO_CACHE.includes(requestUrl.pathname);

        if (shouldCache) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response("Offline", { status: 503 });
        });
      }),
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      data: {
        url: data.url ?? "/dashboard",
      },
    }),
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    }),
  );
});
