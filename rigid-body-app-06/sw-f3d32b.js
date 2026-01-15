
const VERSION = "f3d32b"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/rigid-body-app-06";
const CACHE_NAME = "tyracorn.rigid-boddy-app-06-f3d32b";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/rigid-body-app-06/","/tyracorn-web-examples/rigid-body-app-06/index.html","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ar-backgrounds.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/box-01.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/characters/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/characters/tyracorn.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-blocks-128.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-blocks-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-bold-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-future-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-future-square-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-space-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/nobile-regular-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/rubik-bold-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/rubik-regular-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/images.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/primitives.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/sounds.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/buttons-controls.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/buttons.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/controls.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/fonts.tap"];

// On install, cache the static resources
self.addEventListener("install", (event) => {
    event.waitUntil(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                cache.addAll(APP_STATIC_RESOURCES);
            })(),
            );
});

// delete old caches on activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
            (async () => {
                const names = await caches.keys();
                await Promise.all(
                        names.map((name) => {
                            if (name !== CACHE_NAME) {
                                return caches.delete(name);
                            }
                            return undefined;
                        }),
                        );
                await clients.claim();
            })(),
            );
});

// On fetch, intercept server requests
// and respond with cached responses instead of going to network
self.addEventListener("fetch", (event) => {
    // As a single page app, direct app to always go to cached home page.
    if (event.request.mode === "navigate") {
        event.respondWith(caches.match(BASE_PATH + "/"));
        return;
    }

    // For all other requests, go to the cache first, and then the network.
    event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request.url);
                if (cachedResponse) {
                    // Return the cached response if it's available.
                    return cachedResponse;
                }
                // If resource isn't in the cache, return a 404.
                return new Response(null, {status: 404});
            })(),
            );
});
