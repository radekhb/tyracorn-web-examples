
const VERSION = "567231"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/pwa-test-app";
const CACHE_NAME = "tyracorn.pwa-test-app-567231";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/pwa-test-app/","/tyracorn-web-examples/pwa-test-app/index.html","/tyracorn-web-examples/pwa-test-app/manifest.json","/tyracorn-web-examples/pwa-test-app/tyracorn-57a5da.js","/tyracorn-web-examples/pwa-test-app/style-7fa826.css","/tyracorn-web-examples/pwa-test-app/tyracorn-256.png","/tyracorn-web-examples/pwa-test-app/tyracorn-512.png","/tyracorn-web-examples/pwa-test-app/tyracorn-540x960.png","/tyracorn-web-examples/pwa-test-app/tyracorn-960x540.jpg","/tyracorn-web-examples/pwa-test-app/assets-fba731/content.json","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/content.json","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/images.tap","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/ui/buttons-controls.tap","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/ui/buttons.tap","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/ui/content.json","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/ui/controls.tap","/tyracorn-web-examples/pwa-test-app/assets-fba731/packages/ui/fonts.tap"];

self.addEventListener("install", event => {
    // Kick out old service worker
    self.skipWaiting();
    event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(APP_STATIC_RESOURCES);
    })
            );
});

self.addEventListener("activate", event => {
    // Delete any cache that is not current
    event.waitUntil(
            caches.keys().then(keys => {
        Promise.all(
                keys.map(key => {
                    if (![CACHE_NAME].includes(key)) {
                        return caches.delete(key);
                    }
                })
                )
    })
            );
});

// Use offline-first, cache-first strategy
self.addEventListener("fetch", event => {
    event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
            return response || fetch(event.request).then(networkResponse => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        })
    })
            );
});
