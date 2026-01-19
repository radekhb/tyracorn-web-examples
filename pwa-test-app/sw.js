
const VERSION = "696939"; // version - need to change on every modificaiton
const BASE_PATH = "/tyracorn-web-examples/pwa-test-app";
const CACHE_NAME = "tyracorn.pwa-test-app-696939";

// The static resources that the app needs to function
const APP_STATIC_RESOURCES = ["/tyracorn-web-examples/pwa-test-app/","/tyracorn-web-examples/pwa-test-app/index.html","/tyracorn-web-examples/pwa-test-app/manifest.json","/tyracorn-web-examples/pwa-test-app/tyracorn-938cef.js","/tyracorn-web-examples/pwa-test-app/style-7fa826.css","/tyracorn-web-examples/pwa-test-app/tyracorn-256.png","/tyracorn-web-examples/pwa-test-app/tyracorn-512.png","/tyracorn-web-examples/pwa-test-app/tyracorn-540x960.png","/tyracorn-web-examples/pwa-test-app/tyracorn-960x540.jpg","/tyracorn-web-examples/pwa-test-app/assets-882ef4/content.json","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ar-backgrounds.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/box-01.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/characters/content.json","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/characters/tyracorn.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/content.json","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/content.json","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-blocks-128.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-blocks-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-bold-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-future-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-future-square-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/kenny-space-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/nobile-regular-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/rubik-bold-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/fonts-extra/rubik-regular-64.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/images.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/primitives.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/sounds.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ui/buttons-controls.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ui/buttons.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ui/content.json","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ui/controls.tap","/tyracorn-web-examples/pwa-test-app/assets-882ef4/packages/ui/fonts.tap"];

self.addEventListener("install", event => {
	// Kick out old service worker
	// self.skipWaiting(); -- testing to comment thi out
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
