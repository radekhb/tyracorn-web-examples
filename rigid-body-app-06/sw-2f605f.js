
const VERSION = "2f605f"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/rigid-body-app-06";
const CACHE_NAME = "tyracorn.rigid-boddy-app-06-2f605f";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/rigid-body-app-06/","/tyracorn-web-examples/rigid-body-app-06/index.html","/tyracorn-web-examples/rigid-body-app-06/manifest.json","/tyracorn-web-examples/rigid-body-app-06/tyracorn-b63494.js","/tyracorn-web-examples/rigid-body-app-06/style-6592d2.css","/tyracorn-web-examples/rigid-body-app-06/tyracorn-256.png","/tyracorn-web-examples/rigid-body-app-06/tyracorn-512.png","/tyracorn-web-examples/rigid-body-app-06/tyracorn-540x960.png","/tyracorn-web-examples/rigid-body-app-06/tyracorn-960x540.jpg","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ar-backgrounds.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/box-01.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/characters/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/characters/tyracorn.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-blocks-128.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-blocks-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-bold-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-future-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-future-square-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/kenny-space-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/nobile-regular-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/rubik-bold-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/fonts-extra/rubik-regular-64.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/images.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/primitives.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/sounds.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/buttons-controls.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/buttons.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/content.json","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/controls.tap","/tyracorn-web-examples/rigid-body-app-06/assets-882ef4/packages/ui/fonts.tap"];

// On install, cache the static resources
self.addEventListener("install", (event) => {
    console.log("Install event" + CACHE_NAME);
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_STATIC_RESOURCES)));
});

// delete old caches on activate
self.addEventListener("activate", (event) => {
    console.log("Activate event:" + CACHE_NAME);
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

self.addEventListener("fetch", (event) => {
    console.log(event.request.url);
    event.respondWith(
            caches.match(event.request).then((response) => {
        console.log("Activate event:" + CACHE_NAME + ": " + event.request.url);
        console.log(response);
        if (response !== undefined) {
            return response;
        }
        return fetch(event.request)
                .then((response) => {
                    // response may be used only once
                    // we need to save clone to put one copy in cache
                    // and serve second one
                    let responseClone = response.clone();
                    caches
                            .open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(BASE_PATH));
    }),
            );
});
