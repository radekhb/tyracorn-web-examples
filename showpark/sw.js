
const VERSION = "1e7661"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/showpark";
const CACHE_NAME = "tyracorn.showpark-1e7661";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/showpark/","/tyracorn-web-examples/showpark/index.html","/tyracorn-web-examples/showpark/manifest.json","/tyracorn-web-examples/showpark/tyracorn-6f50d8.js","/tyracorn-web-examples/showpark/style-7fa826.css","/tyracorn-web-examples/showpark/icon-48.png","/tyracorn-web-examples/showpark/icon-128.png","/tyracorn-web-examples/showpark/icon-256.png","/tyracorn-web-examples/showpark/icon-512.png","/tyracorn-web-examples/showpark/screenshot-01-856x1789.jpg","/tyracorn-web-examples/showpark/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/showpark/assets-892afa/content.json","/tyracorn-web-examples/showpark/assets-892afa/default.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ar-backgrounds.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/box-01.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/characters/base-fighter.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/characters/content.json","/tyracorn-web-examples/showpark/assets-892afa/packages/characters/enemies.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/characters/tyracorn.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/content.json","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/content.json","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-blocks-128.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-blocks-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-bold-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-future-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-future-square-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/kenny-space-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/nobile-regular-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/rubik-bold-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/fonts-extra/rubik-regular-64.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/loading.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/physical-materials.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/primitives.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/skybox.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/sounds.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/background.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/buttons-controls.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/buttons.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/content.json","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/controls.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/ui/fonts.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/worlds/content.json","/tyracorn-web-examples/showpark/assets-892afa/packages/worlds/medieval-buildings.tap","/tyracorn-web-examples/showpark/assets-892afa/packages/worlds/medieval-village.tap","/tyracorn-web-examples/showpark/assets-892afa/prefabs.tap","/tyracorn-web-examples/showpark/assets-892afa/scenes.tap"];

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
