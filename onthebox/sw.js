
const VERSION = "a312bf"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/onthebox";
const CACHE_NAME = "onthebox-a312bf";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/onthebox/","/tyracorn-web-examples/onthebox/index.html","/tyracorn-web-examples/onthebox/manifest.json","/tyracorn-web-examples/onthebox/tyracorn-50298d.js","/tyracorn-web-examples/onthebox/style-7fa826.css","/tyracorn-web-examples/onthebox/icon-48.png","/tyracorn-web-examples/onthebox/icon-128.png","/tyracorn-web-examples/onthebox/icon-256.png","/tyracorn-web-examples/onthebox/icon-512.png","/tyracorn-web-examples/onthebox/screenshot-01-856x1789.jpg","/tyracorn-web-examples/onthebox/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/onthebox/assets-b40d98/content.json","/tyracorn-web-examples/onthebox/assets-b40d98/default.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/box-basic.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/blood.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/bullets.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/content.json","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/cute-monsters.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/kimono-female.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/sounds.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/characters/tyracorn.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/content.json","/tyracorn-web-examples/onthebox/assets-b40d98/packages/images.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/items.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/physical-materials.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/skybox.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/sprites.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/ui/buttons.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/ui/content.json","/tyracorn-web-examples/onthebox/assets-b40d98/packages/ui/controls.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/ui/fonts.tap","/tyracorn-web-examples/onthebox/assets-b40d98/packages/ui/panels.tap","/tyracorn-web-examples/onthebox/assets-b40d98/prefabs.tap","/tyracorn-web-examples/onthebox/assets-b40d98/scenes.tap"];

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
