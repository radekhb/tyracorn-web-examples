
const VERSION = "362a05"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/onthebox";
const CACHE_NAME = "onthebox-362a05";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/onthebox/","/tyracorn-web-examples/onthebox/index.html","/tyracorn-web-examples/onthebox/manifest.json","/tyracorn-web-examples/onthebox/tyracorn-afbce3.js","/tyracorn-web-examples/onthebox/style-7fa826.css","/tyracorn-web-examples/onthebox/icon-48.webp","/tyracorn-web-examples/onthebox/icon-96.webp","/tyracorn-web-examples/onthebox/icon-144.webp","/tyracorn-web-examples/onthebox/icon-192.webp","/tyracorn-web-examples/onthebox/screenshot-01-856x1789.jpg","/tyracorn-web-examples/onthebox/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/onthebox/assets-b99948/content.json","/tyracorn-web-examples/onthebox/assets-b99948/default.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/box-basic.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/blood.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/bullets.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/content.json","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/cute-monsters.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/kimono-female.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/sounds.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/characters/tyracorn.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/content.json","/tyracorn-web-examples/onthebox/assets-b99948/packages/images.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/items.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/physical-materials.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/skybox.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/sprites.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/ui/buttons.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/ui/content.json","/tyracorn-web-examples/onthebox/assets-b99948/packages/ui/controls.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/ui/fonts.tap","/tyracorn-web-examples/onthebox/assets-b99948/packages/ui/panels.tap","/tyracorn-web-examples/onthebox/assets-b99948/prefabs.tap","/tyracorn-web-examples/onthebox/assets-b99948/scenes.tap"];

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
