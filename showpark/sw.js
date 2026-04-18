
const VERSION = "6fb483"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/showpark";
const CACHE_NAME = "tyracorn.showpark-6fb483";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/showpark/","/tyracorn-web-examples/showpark/index.html","/tyracorn-web-examples/showpark/manifest.json","/tyracorn-web-examples/showpark/tyracorn-5580bc.js","/tyracorn-web-examples/showpark/style-7fa826.css","/tyracorn-web-examples/showpark/icon-48.png","/tyracorn-web-examples/showpark/icon-128.png","/tyracorn-web-examples/showpark/icon-256.png","/tyracorn-web-examples/showpark/icon-512.png","/tyracorn-web-examples/showpark/screenshot-01-856x1789.jpg","/tyracorn-web-examples/showpark/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/showpark/assets-c8327c/content.json","/tyracorn-web-examples/showpark/assets-c8327c/default.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ar-backgrounds.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/box-01.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/characters/base-fighter.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/characters/content.json","/tyracorn-web-examples/showpark/assets-c8327c/packages/characters/tyracorn.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/content.json","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/content.json","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-blocks-128.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-blocks-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-bold-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-future-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-future-square-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/kenny-space-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/nobile-regular-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/rubik-bold-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/fonts-extra/rubik-regular-64.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/loading.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/physical-materials.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/primitives.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/skybox.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/sounds.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/background.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/buttons-controls.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/buttons.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/content.json","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/controls.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/ui/fonts.tap","/tyracorn-web-examples/showpark/assets-c8327c/packages/worlds/content.json","/tyracorn-web-examples/showpark/assets-c8327c/packages/worlds/medieval-village.tap","/tyracorn-web-examples/showpark/assets-c8327c/prefabs.tap","/tyracorn-web-examples/showpark/assets-c8327c/scenes.tap"];

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
