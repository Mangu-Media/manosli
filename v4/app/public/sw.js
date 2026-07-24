/* manosli+ service worker — PWA groundwork.
 *
 * Scope: `/` (whole site — marketing pages keep working untouched; the SPA
 * fallback is preserved by the network-first navigation strategy).
 *
 * Strategies:
 *  - App shell + same-origin static/build assets: cache-first after install,
 *    with navigation requests network-first (falling back to the cached shell
 *    when offline) so /app and marketing routes always load.
 *  - Media (/assets/*, /audio/*, /icons/*): cache-first, populated lazily on
 *    first fetch — album art and audio stream instantly on repeat visits.
 *
 * Versioned cache names + activate cleanup: bump the suffix on deploys that
 * change caching behavior and old caches are purged automatically.
 */

const VERSION = 'v1';
const SHELL_CACHE = `manosli-shell-${VERSION}`;
const MEDIA_CACHE = `manosli-media-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, MEDIA_CACHE];

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/logo.svg'];

const isMediaRequest = (pathname) =>
  pathname.startsWith('/assets/') || pathname.startsWith('/audio/') || pathname.startsWith('/icons/');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // allSettled: a missing route must never abort installation.
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !KNOWN_CACHES.includes(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fonts/CDN: straight to network

  // Media: cache-first (audio + artwork + icons are immutable assets).
  if (isMediaRequest(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Navigations: network-first so deploys go live immediately; fall back to
  // the cached shell offline (keeps the SPA fallback working).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match('/index.html')) || (await caches.match('/'));
        }),
    );
    return;
  }

  // Everything else same-origin (JS/CSS bundles, manifest): stale-while-revalidate.
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached || fetched;
    }),
  );
});
