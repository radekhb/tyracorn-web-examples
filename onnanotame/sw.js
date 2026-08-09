
const VERSION = "716d0b"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/onnanotame";
const CACHE_NAME = "onnanotame-716d0b";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/onnanotame/","/tyracorn-web-examples/onnanotame/index.html","/tyracorn-web-examples/onnanotame/manifest.json","/tyracorn-web-examples/onnanotame/tyracorn-c955ca.js","/tyracorn-web-examples/onnanotame/style-7fa826.css","/tyracorn-web-examples/onnanotame/icon-48.png","/tyracorn-web-examples/onnanotame/icon-128.png","/tyracorn-web-examples/onnanotame/icon-256.png","/tyracorn-web-examples/onnanotame/icon-512.png","/tyracorn-web-examples/onnanotame/screenshot-01-856x1789.jpg","/tyracorn-web-examples/onnanotame/screenshot-02-1920x1080.jpg","/tyracorn-web-examples/onnanotame/assets-46c98d/content.json","/tyracorn-web-examples/onnanotame/assets-46c98d/default.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/characters/audience.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/characters/base-fighter.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/characters/content.json","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/content.json","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/elements.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/loading.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/music.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/background.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/buttons.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/content.json","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/controls.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/fonts.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/ui/sprites.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/worlds/content.json","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/worlds/medieval-village.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/worlds/nature.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/worlds/sci-fi.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/packages/worlds/skybox.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/prefabs.tap","/tyracorn-web-examples/onnanotame/assets-46c98d/scenes.tap"];

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
