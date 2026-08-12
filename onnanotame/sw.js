
const VERSION = "1570e1"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/onnanotame";
const CACHE_NAME = "onnanotame-1570e1";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/onnanotame/","/tyracorn-web-examples/onnanotame/index.html","/tyracorn-web-examples/onnanotame/manifest.json","/tyracorn-web-examples/onnanotame/tyracorn-1ae7ea.js","/tyracorn-web-examples/onnanotame/style-7fa826.css","/tyracorn-web-examples/onnanotame/icon-48.png","/tyracorn-web-examples/onnanotame/icon-128.png","/tyracorn-web-examples/onnanotame/icon-256.png","/tyracorn-web-examples/onnanotame/icon-512.png","/tyracorn-web-examples/onnanotame/screenshot-01-856x1789.jpg","/tyracorn-web-examples/onnanotame/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/onnanotame/assets-f51b56/content.json","/tyracorn-web-examples/onnanotame/assets-f51b56/default.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/characters/audience.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/characters/base-fighter.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/characters/content.json","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/content.json","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/elements.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/loading.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/music.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/background.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/buttons.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/content.json","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/controls.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/fonts.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/ui/sprites.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/worlds/content.json","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/worlds/medieval-village.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/worlds/nature.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/worlds/sci-fi.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/packages/worlds/skybox.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/prefabs.tap","/tyracorn-web-examples/onnanotame/assets-f51b56/scenes.tap"];

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
