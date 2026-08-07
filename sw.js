/* 4h MACD Scanner service worker — makes the page installable and offline-friendly
   without ever serving a stale scan: navigations are network-first, build.json is
   always live, only static shell assets are cache-first. */
const CACHE = 'macd-scan-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // build.json: always hit the network so auto-update keeps working
  if (url.pathname.endsWith('build.json')) {
    e.respondWith(fetch(e.request).catch(function () { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); }));
    return;
  }
  // navigations / index: network-first, cache the fresh copy, fall back offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(function (r) {
        var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); });
        return r;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }
  // static assets: cache-first
  e.respondWith(caches.match(e.request).then(function (c) { return c || fetch(e.request); }));
});
